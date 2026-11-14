package co.uis.investsim.config;

import co.uis.investsim.common.sequence.SequenceService;
import co.uis.investsim.education.entity.EducationalContent;
import co.uis.investsim.education.repository.EducationalContentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.Instant;
import java.util.List;

@Configuration
@Profile("!test")
public class EducationSeeder {

    private record Seed(String title, String slug, String category, String summary, String content,
                        String level, int order) {
    }

    private static final List<Seed> CONTENTS = List.of(
            new Seed("¿Qué es invertir?", "que-es-invertir", "Fundamentos",
                    "Comprende la diferencia entre ahorrar e invertir y el papel del riesgo.",
                    "Invertir consiste en destinar recursos a un activo con la expectativa de obtener un rendimiento futuro. "
                            + "A diferencia del ahorro, que busca preservar el capital, una inversión implica asumir un riesgo "
                            + "a cambio de una posible rentabilidad. En InvestSim todo el dinero es ficticio: el objetivo es "
                            + "aprender experimentando.",
                    "BASICO", 1),
            new Seed("Diversificación del portafolio", "diversificacion", "Riesgo",
                    "Aprende por qué repartir el capital reduce el riesgo específico.",
                    "La diversificación combina activos con comportamientos distintos para reducir el impacto de un mal "
                            + "resultado individual. Un portafolio concentrado en una sola acción depende completamente de esa "
                            + "empresa; uno diversificado distribuye el riesgo entre sectores, regiones y tipos de activo.",
                    "BASICO", 2),
            new Seed("Acciones y ETFs", "acciones-y-etfs", "Instrumentos",
                    "Conoce las diferencias entre comprar una acción y un fondo cotizado.",
                    "Una acción representa una participación en una empresa. Un ETF es un fondo que cotiza como una acción "
                            + "y agrupa muchos activos, lo que facilita la diversificación. Los ETFs suelen tener menor "
                            + "volatilidad que una acción individual, aunque también pueden perder valor.",
                    "BASICO", 3),
            new Seed("Interés compuesto", "interes-compuesto", "Ahorro",
                    "Descubre cómo el tiempo potencia el crecimiento de tu capital.",
                    "El interés compuesto reinvierte los rendimientos para que generen nuevos rendimientos. La fórmula es "
                            + "A = P(1 + r/n)^(nt), donde P es el capital, r la tasa anual, n la frecuencia de capitalización "
                            + "y t el tiempo en años. Cuanto mayor sea el plazo, mayor será el efecto.",
                    "INTERMEDIO", 4),
            new Seed("Volatilidad y rendimiento", "volatilidad-y-rendimiento", "Análisis",
                    "Interpreta la volatilidad como medida del riesgo de mercado.",
                    "La volatilidad mide cuánto fluctúa el precio de un activo. Una volatilidad alta implica mayores "
                            + "variaciones y, por tanto, mayor incertidumbre. En analítica financiera se suele anualizar la "
                            + "desviación estándar de los rendimientos diarios multiplicándola por la raíz de 252.",
                    "INTERMEDIO", 5),
            new Seed("Simulación de crisis y escenarios", "simulacion-de-escenarios", "Escenarios",
                    "Aprende a evaluar el impacto de choques de mercado en tu portafolio.",
                    "Un escenario de crisis aplica un choque negativo a los precios y puede incrementar la volatilidad. "
                            + "En InvestSim puedes ajustar el porcentaje de caída, el multiplicador de volatilidad y la "
                            + "duración para observar el valor proyectado de tu portafolio antes de tomar decisiones.",
                    "AVANZADO", 6)
    );

    @Bean
    public CommandLineRunner initEducation(EducationalContentRepository contentRepository,
                                           SequenceService sequenceService) {
        return args -> {
            for (Seed seed : CONTENTS) {
                if (!contentRepository.existsBySlug(seed.slug())) {
                    EducationalContent content = new EducationalContent();
                    content.setId(sequenceService.next("educational_content"));
                    content.setTitle(seed.title());
                    content.setSlug(seed.slug());
                    content.setCategory(seed.category());
                    content.setSummary(seed.summary());
                    content.setContent(seed.content());
                    content.setLevel(seed.level());
                    content.setDisplayOrder(seed.order());
                    content.setActive(true);
                    content.setCreatedAt(Instant.now());
                    contentRepository.save(content);
                }
            }
        };
    }
}
