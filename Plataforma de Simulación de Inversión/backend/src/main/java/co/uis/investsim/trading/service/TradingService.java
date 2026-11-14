package co.uis.investsim.trading.service;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.common.exception.NotFoundException;
import co.uis.investsim.common.sequence.SequenceService;
import co.uis.investsim.common.util.NumberUtils;
import co.uis.investsim.marketdata.entity.Instrument;
import co.uis.investsim.marketdata.service.MarketDataService;
import co.uis.investsim.portfolio.entity.Portfolio;
import co.uis.investsim.portfolio.entity.Position;
import co.uis.investsim.portfolio.repository.PortfolioRepository;
import co.uis.investsim.portfolio.repository.PositionRepository;
import co.uis.investsim.trading.dto.TradeRequestDTO;
import co.uis.investsim.trading.dto.TradeTransactionDTO;
import co.uis.investsim.trading.entity.TradeTransaction;
import co.uis.investsim.trading.entity.TransactionType;
import co.uis.investsim.trading.mapper.TradeMapper;
import co.uis.investsim.trading.repository.TradeTransactionRepository;
import co.uis.investsim.user.entity.UserEntity;
import co.uis.investsim.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TradingService {
    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final PositionRepository positionRepository;
    private final TradeTransactionRepository transactionRepository;
    private final MarketDataService marketDataService;
    private final SequenceService sequenceService;
    private final TradeMapper tradeMapper;

    public TradeTransactionDTO buy(String email, TradeRequestDTO in) {
        return execute(email, in, TransactionType.BUY);
    }

    public TradeTransactionDTO sell(String email, TradeRequestDTO in) {
        return execute(email, in, TransactionType.SELL);
    }

    public List<TradeTransactionDTO> listByUser(String email) {
        UserEntity user = findUser(email);
        return transactionRepository.findByUserIdOrderByExecutedAtDesc(user.getId()).stream()
                .map(tradeMapper::toDto)
                .toList();
    }

    public List<TradeTransactionDTO> listByPortfolio(Long portfolioId, String email) {
        UserEntity user = findUser(email);
        return transactionRepository
                .findByPortfolioIdAndUserIdOrderByExecutedAtDesc(portfolioId, user.getId()).stream()
                .map(tradeMapper::toDto)
                .toList();
    }

    private TradeTransactionDTO execute(String email, TradeRequestDTO in, TransactionType operation) {
        UserEntity user = findUser(email);

        Portfolio portfolio = portfolioRepository
                .findByIdAndUserIdAndActiveTrue(in.getPortfolioId(), user.getId())
                .orElseThrow(() -> new NotFoundException(
                        "Portafolio no encontrado con ID " + in.getPortfolioId() + "."));

        Instrument instrument = marketDataService.findInstrument(in.getSymbol());

        if (!Boolean.TRUE.equals(instrument.getActive())) {
            throw new BusinessException("El instrumento " + instrument.getSymbol() + " no está activo.");
        }

        BigDecimal price = marketDataService.getQuote(instrument.getSymbol()).price()
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal quantity = in.getQuantity().setScale(4, RoundingMode.HALF_UP);
        BigDecimal total = quantity.multiply(price).setScale(2, RoundingMode.HALF_UP);

        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El valor de la operación debe ser mayor que cero.");
        }

        Position position = positionRepository
                .findByPortfolioIdAndSymbolIgnoreCase(portfolio.getId(), instrument.getSymbol())
                .orElse(null);

        if (operation == TransactionType.BUY) {
            applyBuy(user, portfolio, instrument, position, quantity, price, total);
        } else {
            applySell(user, portfolio, instrument, position, quantity, price, total);
        }

        TradeTransaction transaction = new TradeTransaction();
        transaction.setId(sequenceService.next("transactions"));
        transaction.setUserId(user.getId());
        transaction.setPortfolioId(portfolio.getId());
        transaction.setInstrumentId(instrument.getId());
        transaction.setSymbol(instrument.getSymbol());
        transaction.setType(operation);
        transaction.setQuantity(quantity);
        transaction.setPrice(price);
        transaction.setTotal(total);
        transaction.setStatus("COMPLETED");
        transaction.setExecutedAt(Instant.now());

        return tradeMapper.toDto(transactionRepository.save(transaction));
    }

    private void applyBuy(UserEntity user, Portfolio portfolio, Instrument instrument, Position position,
                          BigDecimal quantity, BigDecimal price, BigDecimal total) {
        if (user.getAvailableBalance().compareTo(total) < 0) {
            throw new BusinessException("Saldo insuficiente. Saldo disponible: "
                    + user.getAvailableBalance() + ", valor requerido: " + total + ".");
        }

        user.setAvailableBalance(user.getAvailableBalance().subtract(total).setScale(2, RoundingMode.HALF_UP));
        userRepository.save(user);

        if (position == null) {
            position = new Position();
            position.setId(sequenceService.next("positions"));
            position.setPortfolioId(portfolio.getId());
            position.setInstrumentId(instrument.getId());
            position.setSymbol(instrument.getSymbol());
            position.setQuantity(quantity);
            position.setAverageCost(price);
        } else {
            BigDecimal newQuantity = position.getQuantity().add(quantity);
            BigDecimal previousCost = position.getQuantity().multiply(position.getAverageCost());
            BigDecimal newCost = previousCost.add(total);
            BigDecimal newAverageCost = NumberUtils.safeDivide(newCost, newQuantity).setScale(4, RoundingMode.HALF_UP);

            position.setQuantity(newQuantity);
            position.setAverageCost(newAverageCost);
        }

        position.setUpdatedAt(Instant.now());
        positionRepository.save(position);
    }

    private void applySell(UserEntity user, Portfolio portfolio, Instrument instrument, Position position,
                           BigDecimal quantity, BigDecimal price, BigDecimal total) {
        if (position == null || position.getQuantity().compareTo(quantity) < 0) {
            throw new BusinessException("No hay suficientes unidades de " + instrument.getSymbol()
                    + " para realizar la venta.");
        }

        BigDecimal remaining = position.getQuantity().subtract(quantity);

        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            positionRepository.delete(position);
        } else {
            position.setQuantity(remaining);
            position.setUpdatedAt(Instant.now());
            positionRepository.save(position);
        }

        user.setAvailableBalance(user.getAvailableBalance().add(total).setScale(2, RoundingMode.HALF_UP));
        userRepository.save(user);
    }

    private UserEntity findUser(String email) {
        return userRepository.findByEmailAndActiveTrue(email.trim().toLowerCase())
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado con email " + email + "."));
    }
}
