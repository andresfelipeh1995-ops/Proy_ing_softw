package co.uis.investsim.marketdata.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "ingestion_logs")
public class IngestionLog {
    @Id
    private Long id;

    @Column(length = 40)
    private String provider;

    @Column(length = 20)
    private String symbol;

    @Column(length = 20)
    private String operation;

    @Column(length = 20)
    private String status;

    @Column(length = 1000)
    private String message;

    private Integer recordsProcessed = 0;

    private Instant startedAt;

    private Instant finishedAt;
}
