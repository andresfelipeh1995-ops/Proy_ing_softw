package co.uis.investsim.marketdata.ingestion;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "ingestion", name = "enabled", havingValue = "true", matchIfMissing = true)
public class IngestionScheduler {
    private final PriceIngestionService priceIngestionService;

    @Scheduled(cron = "${ingestion.cron:0 0 */6 * * *}")
    public void ingestMarketData() {
        log.info("Iniciando ingesta programada de datos de mercado.");
        priceIngestionService.ingestAll();
        log.info("Ingesta programada de datos de mercado finalizada.");
    }
}
