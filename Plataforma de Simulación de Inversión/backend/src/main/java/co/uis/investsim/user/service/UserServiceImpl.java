package co.uis.investsim.user.service;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.common.exception.NotFoundException;
import co.uis.investsim.common.sequence.SequenceService;
import co.uis.investsim.user.dto.PasswordUpdateDTO;
import co.uis.investsim.user.entity.UserEntity;
import co.uis.investsim.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SequenceService sequenceService;

    @Value("${app.default-initial-balance:100000}")
    private BigDecimal defaultInitialBalance;

    @Override
    public UserEntity create(UserEntity in) {
        String email = in.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("El email ya se encuentra registrado.");
        }

        in.setId(sequenceService.next("users"));
        in.setEmail(email);
        in.setPassword(passwordEncoder.encode(in.getPassword()));
        in.setRole("CLIENTE");
        in.setInitialBalance(defaultInitialBalance);
        in.setAvailableBalance(defaultInitialBalance);
        in.setActive(true);
        in.setCreatedAt(Instant.now());

        return userRepository.save(in);
    }

    @Override
    public UserEntity findById(Long id) {
        return userRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado con ID " + id + "."));
    }

    @Override
    public UserEntity findByEmail(String email) {
        return userRepository.findByEmailAndActiveTrue(email.trim().toLowerCase())
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado con email " + email + "."));
    }

    @Override
    public List<UserEntity> findAll() {
        return userRepository.findAllByActiveTrue();
    }

    @Override
    public UserEntity update(String email, UserEntity in) {
        UserEntity existing = findByEmail(email);
        String newEmail = in.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmailAndIdNot(newEmail, existing.getId())) {
            throw new BusinessException("El email ya se encuentra registrado.");
        }

        existing.setEmail(newEmail);
        existing.setFirstName(in.getFirstName());
        existing.setLastName(in.getLastName());

        return userRepository.save(existing);
    }

    @Override
    public void deactivate(String email) {
        UserEntity existing = findByEmail(email);
        existing.setActive(false);
        userRepository.save(existing);
    }

    @Override
    public void deactivate(Long id) {
        UserEntity existing = findById(id);

        if ("ADMIN".equals(existing.getRole())) {
            throw new BusinessException("No se puede desactivar una cuenta de administrador.");
        }

        existing.setActive(false);
        userRepository.save(existing);
    }

    @Override
    public void updatePassword(String email, PasswordUpdateDTO in) {
        UserEntity existing = findByEmail(email);

        if (!passwordEncoder.matches(in.getCurrentPassword(), existing.getPassword())) {
            throw new BusinessException("La contraseña actual es incorrecta.");
        }

        existing.setPassword(passwordEncoder.encode(in.getNewPassword()));
        userRepository.save(existing);
    }

    @Override
    public UserEntity adjustBalance(String email, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El monto debe ser mayor que cero.");
        }

        UserEntity existing = findByEmail(email);
        BigDecimal newBalance = existing.getAvailableBalance()
                .add(amount)
                .setScale(2, RoundingMode.HALF_UP);

        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Saldo insuficiente para realizar la operación.");
        }

        existing.setAvailableBalance(newBalance);
        return userRepository.save(existing);
    }
}
