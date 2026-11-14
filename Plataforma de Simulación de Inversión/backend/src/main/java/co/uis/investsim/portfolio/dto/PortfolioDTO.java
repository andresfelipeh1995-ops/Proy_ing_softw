package co.uis.investsim.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class PortfolioDTO {
    private Long id;
    private String name;
    private String description;
    private Boolean active;
    private Instant createdAt;
    private PortfolioSummaryDTO summary;
    private List<PositionDTO> positions;
}
