package co.uis.investsim.education.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class EducationalContentDTO {
    private Long id;
    private String title;
    private String slug;
    private String category;
    private String summary;
    private String content;
    private String level;
    private Integer displayOrder;
    private Boolean active;
    private Instant createdAt;
}
