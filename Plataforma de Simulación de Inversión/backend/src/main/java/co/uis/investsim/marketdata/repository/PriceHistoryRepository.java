package co.uis.investsim.marketdata.repository;

import co.uis.investsim.marketdata.entity.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {
    List<PriceHistory> findBySymbolOrderByDateAsc(String symbol);

    List<PriceHistory> findBySymbolAndDateAfterOrderByDateAsc(String symbol, LocalDate from);

    Optional<PriceHistory> findBySymbolAndDate(String symbol, LocalDate date);

    Optional<PriceHistory> findTopBySymbolOrderByDateDesc(String symbol);

    long countBySymbol(String symbol);
}
