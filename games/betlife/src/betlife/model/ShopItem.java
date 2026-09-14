package betlife.model;

/**
 * Something for sale in the shop. Buying it turns it into an {@link Asset}.
 */
public class ShopItem {

    private final String name;
    private final String type;
    private final int cost;
    private final LifeStage minimumStage;

    public ShopItem(String name, String type, int cost, LifeStage minimumStage) {
        this.name = name;
        this.type = type;
        this.cost = cost;
        this.minimumStage = minimumStage;
    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public int getCost() {
        return cost;
    }

    /** True when someone in this stage of life is old enough to buy the item. */
    public boolean isAvailableIn(LifeStage stage) {
        return stage.ordinal() >= minimumStage.ordinal();
    }
}
