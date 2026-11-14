package co.uis.investsim.marketdata.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class IngestionLogDTO {
    private Long id;
    private String provider;
    private String symbol;
    private String operation;
    private String status;
    private String message;
    private Integer recordsProcessed;
    private Instant startedAt;
    private Instant finishedAt;
}
