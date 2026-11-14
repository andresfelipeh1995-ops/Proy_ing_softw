package co.uis.investsim.education.service;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.common.exception.NotFoundException;
import co.uis.investsim.common.sequence.SequenceService;
import co.uis.investsim.education.dto.EducationalContentDTO;
import co.uis.investsim.education.dto.EducationalContentRequestDTO;
import co.uis.investsim.education.entity.EducationalContent;
import co.uis.investsim.education.mapper.EducationMapper;
import co.uis.investsim.education.repository.EducationalContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EducationService {
    private final EducationalContentRepository contentRepository;
    private final EducationMapper educationMapper;
    private final SequenceService sequenceService;

    public List<EducationalContentDTO> list(String category) {
        List<EducationalContent> contents = category == null || category.isBlank()
                ? contentRepository.findByActiveTrueOrderByDisplayOrderAsc()
                : contentRepository.findByCategoryIgnoreCaseAndActiveTrueOrderByDisplayOrderAsc(category);

        return contents.stream().map(educationMapper::toDto).toList();
    }

    public EducationalContentDTO getBySlug(String slug) {
        return educationMapper.toDto(contentRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new NotFoundException("Contenido no encontrado con slug " + slug + ".")));
    }

    public EducationalContentDTO create(EducationalContentRequestDTO in) {
        if (contentRepository.existsBySlug(in.getSlug().trim().toLowerCase())) {
            throw new BusinessException("Ya existe contenido con el slug indicado.");
        }

        EducationalContent entity = educationMapper.toEntity(in);
        entity.setId(sequenceService.next("educational_content"));
        entity.setActive(true);
        entity.setCreatedAt(Instant.now());

        return educationMapper.toDto(contentRepository.save(entity));
    }

    public EducationalContentDTO update(Long id, EducationalContentRequestDTO in) {
        EducationalContent entity = contentRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("Contenido no encontrado con ID " + id + "."));

        educationMapper.apply(entity, in);
        return educationMapper.toDto(contentRepository.save(entity));
    }

    public void deactivate(Long id) {
        EducationalContent entity = contentRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("Contenido no encontrado con ID " + id + "."));
        entity.setActive(false);
        contentRepository.save(entity);
    }
}
