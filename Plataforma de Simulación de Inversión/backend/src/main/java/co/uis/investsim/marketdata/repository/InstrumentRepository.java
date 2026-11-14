package co.uis.investsim.marketdata.repository;

import co.uis.investsim.marketdata.entity.Instrument;
import co.uis.investsim.marketdata.entity.InstrumentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstrumentRepository extends JpaRepository<Instrument, Long> {
    Optional<Instrument> findBySymbolIgnoreCase(String symbol);

    boolean existsBySymbolIgnoreCase(String symbol);

    List<Instrument> findByActiveTrue();

    List<Instrument> findByTypeAndActiveTrue(InstrumentType type);
}
