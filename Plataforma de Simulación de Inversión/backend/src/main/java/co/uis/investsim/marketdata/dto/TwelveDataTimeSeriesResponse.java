package co.uis.investsim.marketdata.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@NoArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class TwelveDataTimeSeriesResponse {
    private String status;
    private String message;
    private List<Value> values;

    @NoArgsConstructor
    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Value {
        private String datetime;
        private String open;
        private String high;
        private String low;
        private String close;
        private String volume;
    }
}
