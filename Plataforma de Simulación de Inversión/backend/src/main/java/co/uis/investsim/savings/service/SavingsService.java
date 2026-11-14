package co.uis.investsim.savings.service;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.common.exception.NotFoundException;
import co.uis.investsim.common.sequence.SequenceService;
import co.uis.investsim.savings.dto.SavingsAccountDTO;
import co.uis.investsim.savings.dto.SavingsCreateDTO;
import co.uis.investsim.savings.dto.SavingsProjectionDTO;
import co.uis.investsim.savings.entity.SavingsAccount;
import co.uis.investsim.savings.mapper.SavingsMapper;
import co.uis.investsim.savings.repository.SavingsAccountRepository;
import co.uis.investsim.user.entity.UserEntity;
import co.uis.investsim.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SavingsService {
    private final SavingsAccountRepository savingsAccountRepository;
    private final UserRepository userRepository;
    private final SavingsMapper savingsMapper;
    private final SequenceService sequenceService;

    public SavingsAccountDTO create(String email, SavingsCreateDTO in) {
        UserEntity user = findUser(email);

        if (user.getAvailableBalance().compareTo(in.getPrincipal()) < 0) {
            throw new BusinessException("Saldo insuficiente para abrir la cuenta de ahorro.");
        }

        user.setAvailableBalance(user.getAvailableBalance().subtract(in.getPrincipal())
                .setScale(2, RoundingMode.HALF_UP));
        userRepository.save(user);

        LocalDate start = LocalDate.now();

        SavingsAccount account = new SavingsAccount();
        account.setId(sequenceService.next("savings_accounts"));
        account.setUserId(user.getId());
        account.setName(in.getName().trim());
        account.setPrincipal(in.getPrincipal().setScale(2, RoundingMode.HALF_UP));
        account.setAnnualInterestRate(in.getAnnualInterestRate());
        account.setFrequency(in.getFrequency());
        account.setTermMonths(in.getTermMonths());
        account.setStartDate(start);
        account.setMaturityDate(start.plusMonths(in.getTermMonths()));
        account.setActive(true);
        account.setCreatedAt(Instant.now());

        return savingsMapper.toDto(savingsAccountRepository.save(account));
    }

    public List<SavingsAccountDTO> list(String email) {
        UserEntity user = findUser(email);
        return savingsAccountRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .map(savingsMapper::toDto)
                .toList();
    }

    public SavingsAccountDTO get(Long id, String email) {
        return savingsMapper.toDto(findOwned(id, email));
    }

    public SavingsProjectionDTO simulate(SavingsCreateDTO in) {
        return savingsMapper.toProjection(in);
    }

    public SavingsAccountDTO close(Long id, String email) {
        UserEntity user = findUser(email);
        SavingsAccount account = findOwned(id, email);

        long days = Math.max(ChronoUnit.DAYS.between(account.getStartDate(), LocalDate.now()), 0);
        double years = days / 365.0;
        BigDecimal amount = savingsMapper.finalAmount(account.getPrincipal(), account.getAnnualInterestRate(),
                account.getFrequency(), (int) Math.max(Math.round(years * 12), 1));

        user.setAvailableBalance(user.getAvailableBalance().add(amount).setScale(2, RoundingMode.HALF_UP));
        userRepository.save(user);

        account.setActive(false);
        savingsAccountRepository.save(account);

        return savingsMapper.toDto(account);
    }

    private SavingsAccount findOwned(Long id, String email) {
        UserEntity user = findUser(email);
        return savingsAccountRepository.findByIdAndUserIdAndActiveTrue(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Cuenta de ahorro no encontrada con ID " + id + "."));
    }

    private UserEntity findUser(String email) {
        return userRepository.findByEmailAndActiveTrue(email.trim().toLowerCase())
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado con email " + email + "."));
    }
}
