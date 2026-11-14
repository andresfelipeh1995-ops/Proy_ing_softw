package co.uis.investsim.common.sequence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SequenceService {
    private final SequenceRepository sequenceRepository;

    @Transactional
    public synchronized Long next(String sequenceName) {
        SequenceEntity sequence = sequenceRepository.findForUpdate(sequenceName).orElse(null);

        if (sequence == null) {
            sequence = new SequenceEntity();
            sequence.setId(sequenceName);
            sequence.setValue(1L);
            sequenceRepository.saveAndFlush(sequence);
            return 1L;
        }

        sequence.setValue(sequence.getValue() + 1);
        return sequence.getValue();
    }
}
