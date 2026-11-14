package co.uis.investsim.user.repository;

import co.uis.investsim.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmailAndActiveTrue(String email);

    Optional<UserEntity> findByIdAndActiveTrue(Long id);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    List<UserEntity> findAllByActiveTrue();
}
