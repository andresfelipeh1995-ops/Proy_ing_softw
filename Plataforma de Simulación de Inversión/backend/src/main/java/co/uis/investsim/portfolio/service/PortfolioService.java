package co.uis.investsim.portfolio.service;

import co.uis.investsim.portfolio.dto.PortfolioCreateDTO;
import co.uis.investsim.portfolio.dto.PortfolioDTO;
import co.uis.investsim.portfolio.dto.PortfolioSummaryDTO;
import co.uis.investsim.portfolio.entity.Portfolio;

import java.util.List;

public interface PortfolioService {
    PortfolioDTO create(String email, PortfolioCreateDTO in);

    List<PortfolioDTO> list(String email);

    PortfolioDTO get(Long id, String email);

    PortfolioDTO update(Long id, String email, PortfolioCreateDTO in);

    void deactivate(Long id, String email);

    PortfolioSummaryDTO summary(Long id, String email);

    Portfolio findOwnedEntity(Long id, String email);
}
