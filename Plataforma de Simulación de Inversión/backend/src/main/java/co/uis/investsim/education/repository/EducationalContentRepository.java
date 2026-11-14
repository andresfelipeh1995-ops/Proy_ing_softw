package co.uis.investsim.education.repository;

import co.uis.investsim.education.entity.EducationalContent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EducationalContentRepository extends JpaRepository<EducationalContent, Long> {
    List<EducationalContent> findByActiveTrueOrderByDisplayOrderAsc();

    List<EducationalContent> findByCategoryIgnoreCaseAndActiveTrueOrderByDisplayOrderAsc(String category);

    Optional<EducationalContent> findBySlugAndActiveTrue(String slug);

    Optional<EducationalContent> findByIdAndActiveTrue(Long id);

    boolean existsBySlug(String slug);
}
