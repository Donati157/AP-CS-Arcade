package betlife.game;

import java.util.ArrayList;
import java.util.List;

/**
 * A question the player must answer before life continues: a title, a description
 * and two or three {@link Choice}s. Used for life events with options and for
 * milestones such as "what's next after graduation?".
 */
public class Decision {

    private final String title;
    private final String description;
    private final ArrayList<Choice> choices = new ArrayList<>();

    public Decision(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public Decision add(Choice choice) {
        choices.add(choice);
        return this;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public List<Choice> getChoices() {
        return choices;
    }
}
