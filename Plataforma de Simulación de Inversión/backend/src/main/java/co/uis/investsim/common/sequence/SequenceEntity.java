package co.uis.investsim.common.sequence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "sequences")
public class SequenceEntity {
    @Id
    @Column(length = 80)
    private String id;

    @Column(name = "seq_value", nullable = false)
    private Long value;
}
