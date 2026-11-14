package co.uis.investsim.common.sequence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SequenceRepository extends JpaRepository<SequenceEntity, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SequenceEntity s where s.id = :id")
    Optional<SequenceEntity> findForUpdate(@Param("id") String id);
}
