package co.uis.investsim.config;

import co.uis.investsim.common.sequence.SequenceService;
import co.uis.investsim.marketdata.entity.Instrument;
import co.uis.investsim.marketdata.entity.InstrumentType;
import co.uis.investsim.marketdata.repository.InstrumentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.Instant;
import java.util.List;

@Configuration
@Profile("!test")
public class MarketCatalogSeeder {
    private record Seed(String symbol, String name, InstrumentType type, String exchange) {
    }

    private static final List<Seed> INSTRUMENTS = List.of(
            new Seed("AAPL", "Apple Inc.", InstrumentType.STOCK, "NASDAQ"),
            new Seed("MSFT", "Microsoft Corporation", InstrumentType.STOCK, "NASDAQ"),
            new Seed("GOOGL", "Alphabet Inc.", InstrumentType.STOCK, "NASDAQ"),
            new Seed("AMZN", "Amazon.com Inc.", InstrumentType.STOCK, "NASDAQ"),
            new Seed("NVDA", "NVIDIA Corporation", InstrumentType.STOCK, "NASDAQ"),
            new Seed("TSLA", "Tesla Inc.", InstrumentType.STOCK, "NASDAQ"),
            new Seed("SPY", "SPDR S&P 500 ETF Trust", InstrumentType.ETF, "NYSE ARCA"),
            new Seed("QQQ", "Invesco QQQ Trust", InstrumentType.ETF, "NASDAQ"),
            new Seed("VOO", "Vanguard S&P 500 ETF", InstrumentType.ETF, "NYSE ARCA"),
            new Seed("VTI", "Vanguard Total Stock Market ETF", InstrumentType.ETF, "NYSE ARCA")
    );

    @Bean
    public CommandLineRunner initMarketCatalog(InstrumentRepository instrumentRepository,
                                               SequenceService sequenceService) {
        return args -> {
            for (Seed seed : INSTRUMENTS) {
                if (!instrumentRepository.existsBySymbolIgnoreCase(seed.symbol())) {
                    Instrument instrument = new Instrument();
                    instrument.setId(sequenceService.next("instruments"));
                    instrument.setSymbol(seed.symbol());
                    instrument.setName(seed.name());
                    instrument.setType(seed.type());
                    instrument.setCurrency("USD");
                    instrument.setExchange(seed.exchange());
                    instrument.setActive(true);
                    instrument.setCreatedAt(Instant.now());
                    instrumentRepository.save(instrument);
                }
            }
        };
    }
}
