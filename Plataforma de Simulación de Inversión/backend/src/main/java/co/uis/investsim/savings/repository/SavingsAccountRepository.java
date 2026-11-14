package co.uis.investsim.savings.repository;

import co.uis.investsim.savings.entity.SavingsAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavingsAccountRepository extends JpaRepository<SavingsAccount, Long> {
    List<SavingsAccount> findByUserIdAndActiveTrue(Long userId);

    Optional<SavingsAccount> findByIdAndUserIdAndActiveTrue(Long id, Long userId);

    List<SavingsAccount> findByActiveTrue();
}
