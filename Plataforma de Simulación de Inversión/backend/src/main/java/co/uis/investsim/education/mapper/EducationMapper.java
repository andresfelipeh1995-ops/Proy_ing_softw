package co.uis.investsim.education.mapper;

import co.uis.investsim.education.dto.EducationalContentDTO;
import co.uis.investsim.education.dto.EducationalContentRequestDTO;
import co.uis.investsim.education.entity.EducationalContent;
import org.springframework.stereotype.Component;

@Component
public class EducationMapper {

    public EducationalContentDTO toDto(EducationalContent entity) {
        return new EducationalContentDTO(
                entity.getId(),
                entity.getTitle(),
                entity.getSlug(),
                entity.getCategory(),
                entity.getSummary(),
                entity.getContent(),
                entity.getLevel(),
                entity.getDisplayOrder(),
                entity.getActive(),
                entity.getCreatedAt()
        );
    }

    public EducationalContent toEntity(EducationalContentRequestDTO dto) {
        EducationalContent entity = new EducationalContent();
        apply(entity, dto);
        return entity;
    }

    public void apply(EducationalContent entity, EducationalContentRequestDTO dto) {
        entity.setTitle(dto.getTitle().trim());
        entity.setSlug(dto.getSlug().trim().toLowerCase());
        entity.setCategory(dto.getCategory().trim());
        entity.setSummary(dto.getSummary().trim());
        entity.setContent(dto.getContent());
        entity.setLevel(dto.getLevel() == null ? "BASICO" : dto.getLevel());
        entity.setDisplayOrder(dto.getDisplayOrder() == null ? 0 : dto.getDisplayOrder());
    }
}
