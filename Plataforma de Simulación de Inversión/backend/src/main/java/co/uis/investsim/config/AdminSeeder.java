package co.uis.investsim.config;

import co.uis.investsim.common.sequence.SequenceService;
import co.uis.investsim.user.entity.UserEntity;
import co.uis.investsim.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Instant;

@Configuration
@Profile("!test")
public class AdminSeeder {

    @Value("${app.admin-email:admin@investsim.co}")
    private String adminEmail;

    @Value("${app.admin-password:Admin123!}")
    private String adminPassword;

    @Bean
    public CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                       SequenceService sequenceService) {
        return args -> {
            String email = adminEmail.trim().toLowerCase();

            if (!userRepository.existsByEmail(email)) {
                UserEntity admin = new UserEntity();
                admin.setId(sequenceService.next("users"));
                admin.setEmail(email);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setFirstName("Administrador");
                admin.setLastName("InvestSim");
                admin.setRole("ADMIN");
                admin.setInitialBalance(BigDecimal.ZERO);
                admin.setAvailableBalance(BigDecimal.ZERO);
                admin.setActive(true);
                admin.setCreatedAt(Instant.now());

                userRepository.save(admin);
            }
        };
    }
}
