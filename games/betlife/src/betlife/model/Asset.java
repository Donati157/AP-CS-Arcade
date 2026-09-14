package betlife.model;

/**
 * Something the player owns, with a dollar value that counts toward net worth.
 */
public class Asset {

    private final String name;
    private final String type;
    private final int value;

    public Asset(String name, String type, int value) {
        this.name = name;
        this.type = type;
        this.value = value;
    }

    public String getName() {
        return name;
    }

    /** Category of the asset, e.g. "Vehicle". */
    public String getType() {
        return type;
    }

    public int getValue() {
        return value;
    }
}
