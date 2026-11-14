package co.uis.investsim.marketdata.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class TwelveDataQuoteResponse {
    private String symbol;
    private String name;
    private String exchange;
    private String currency;
    private String datetime;
    private String open;
    private String high;
    private String low;
    private String close;
    private String previous_close;
    private String change;
    private String percent_change;
    private String volume;
    private String status;
    private String message;
}
