package co.uis.investsim.user.service;

import co.uis.investsim.user.dto.PasswordUpdateDTO;
import co.uis.investsim.user.entity.UserEntity;

import java.math.BigDecimal;
import java.util.List;

public interface UserService {
    UserEntity create(UserEntity in);

    UserEntity findById(Long id);

    UserEntity findByEmail(String email);

    List<UserEntity> findAll();

    UserEntity update(String email, UserEntity in);

    void deactivate(String email);

    void deactivate(Long id);

    void updatePassword(String email, PasswordUpdateDTO in);

    UserEntity adjustBalance(String email, BigDecimal amount);
}
