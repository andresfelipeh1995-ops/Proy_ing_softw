package co.uis.investsim.user.controller;

import co.uis.investsim.common.api.ApiResponse;
import co.uis.investsim.common.api.ResponseBuilder;
import co.uis.investsim.security.JwtUtil;
import co.uis.investsim.user.dto.BalanceAdjustmentDTO;
import co.uis.investsim.user.dto.PasswordUpdateDTO;
import co.uis.investsim.user.dto.UserCreateDTO;
import co.uis.investsim.user.dto.UserDTO;
import co.uis.investsim.user.dto.UserUpdateDTO;
import co.uis.investsim.user.entity.UserEntity;
import co.uis.investsim.user.mapper.UserMapper;
import co.uis.investsim.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<UserDTO>> create(@Valid @RequestBody UserCreateDTO in) {
        UserEntity created = userService.create(userMapper.toEntity(in));
        return ResponseBuilder.created("Se ha creado correctamente el usuario.", userMapper.toDto(created));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> findMe(Principal principal) {
        return ResponseBuilder.ok("OK", userMapper.toDto(userService.findByEmail(principal.getName())));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> updateMe(@Valid @RequestBody UserUpdateDTO in, Principal principal) {
        UserEntity updated = userService.update(principal.getName(), userMapper.toEntity(in));
        UserDTO dto = userMapper.toDto(updated);
        dto.setToken(jwtUtil.generateToken(updated.getEmail(), updated.getRole()));
        return ResponseBuilder.ok("Se ha actualizado correctamente el perfil.", dto);
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deactivateMe(Principal principal) {
        userService.deactivate(principal.getName());
        return ResponseBuilder.ok("Se ha desactivado correctamente la cuenta.");
    }

    @PatchMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> updatePassword(@Valid @RequestBody PasswordUpdateDTO in,
                                                            Principal principal) {
        userService.updatePassword(principal.getName(), in);
        return ResponseBuilder.ok("Se ha actualizado correctamente la contraseña.");
    }

    @PostMapping("/me/balance")
    public ResponseEntity<ApiResponse<UserDTO>> addBalance(@Valid @RequestBody BalanceAdjustmentDTO in,
                                                           Principal principal) {
        UserEntity updated = userService.adjustBalance(principal.getName(), in.getAmount());
        return ResponseBuilder.ok("Se ha agregado saldo a tu cuenta.", userMapper.toDto(updated));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDTO>>> findAll() {
        List<UserDTO> users = userService.findAll().stream().map(userMapper::toDto).toList();
        return ResponseBuilder.ok("OK", users);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> findById(@PathVariable Long id) {
        return ResponseBuilder.ok("OK", userMapper.toDto(userService.findById(id)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        userService.deactivate(id);
        return ResponseBuilder.ok("Se ha desactivado correctamente el usuario.");
    }
}
