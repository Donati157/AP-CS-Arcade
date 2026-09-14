package betlife.model;

/**
 * One entry in the character's life timeline: something that happened at a given age.
 * The kind lets the journal emphasize milestones without changing the text.
 */
public class LifeEvent {

    /** How the journal should present the entry. */
    public enum Kind { NORMAL, POSITIVE, MILESTONE }

    private final int age;
    private final String description;
    private final Kind kind;

    public LifeEvent(int age, String description) {
        this(age, description, Kind.NORMAL);
    }

    public LifeEvent(int age, String description, Kind kind) {
        this.age = age;
        this.description = description;
        this.kind = kind;
    }

    public int getAge() {
        return age;
    }

    public String getDescription() {
        return description;
    }

    public Kind getKind() {
        return kind;
    }
}
