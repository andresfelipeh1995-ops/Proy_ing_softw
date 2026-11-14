package co.uis.investsim.savings.mapper;

import co.uis.investsim.savings.dto.SavingsCreateDTO;
import co.uis.investsim.savings.dto.SavingsProjectionDTO;
import co.uis.investsim.savings.entity.CompoundingFrequency;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SavingsMapperTest {
    private final SavingsMapper mapper = new SavingsMapper();

    @Test
    void projectsCompoundInterest() {
        SavingsCreateDTO dto = new SavingsCreateDTO();
        dto.setName("Ahorro");
        dto.setPrincipal(new BigDecimal("1000"));
        dto.setAnnualInterestRate(new BigDecimal("0.08"));
        dto.setFrequency(CompoundingFrequency.MONTHLY);
        dto.setTermMonths(12);

        SavingsProjectionDTO projection = mapper.toProjection(dto);

        assertEquals(new BigDecimal("1083.00"), projection.getFinalAmount());
        assertEquals(new BigDecimal("83.00"), projection.getInterestEarned());
        assertEquals("MONTHLY", projection.getFrequency());
        assertEquals(12, projection.getMonths());
    }
}
