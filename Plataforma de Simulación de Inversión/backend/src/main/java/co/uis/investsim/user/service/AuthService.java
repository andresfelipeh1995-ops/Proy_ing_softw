package co.uis.investsim.user.service;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.security.JwtUtil;
import co.uis.investsim.user.dto.AuthLoginDTO;
import co.uis.investsim.user.dto.AuthResponseDTO;
import co.uis.investsim.user.entity.UserEntity;
import co.uis.investsim.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponseDTO login(AuthLoginDTO in) {
        UserEntity user = userRepository.findByEmailAndActiveTrue(in.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BusinessException("Las credenciales son inválidas."));

        if (!passwordEncoder.matches(in.getPassword(), user.getPassword())) {
            throw new BusinessException("Las credenciales son inválidas.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        return new AuthResponseDTO(token, user.getEmail(), user.getRole());
    }
}
