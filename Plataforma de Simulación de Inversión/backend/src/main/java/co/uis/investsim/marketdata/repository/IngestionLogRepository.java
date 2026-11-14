package co.uis.investsim.marketdata.repository;

import co.uis.investsim.marketdata.entity.IngestionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IngestionLogRepository extends JpaRepository<IngestionLog, Long> {
    List<IngestionLog> findTop50ByOrderByStartedAtDesc();
}
