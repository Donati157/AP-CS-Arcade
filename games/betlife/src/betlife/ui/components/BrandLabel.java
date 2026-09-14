package betlife.ui.components;

import java.awt.BasicStroke;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.font.FontRenderContext;
import java.awt.font.TextAttribute;
import java.awt.geom.AffineTransform;
import java.awt.geom.Rectangle2D;
import java.util.HashMap;
import java.util.Map;

import javax.swing.JComponent;

import betlife.ui.Theme;

/**
 * The BETLIFE wordmark, painted by hand as text outlines: "BET" in white and "LIFE" in a
 * warm accent, each with a thin dark outline and a one-pixel shadow so the title stays
 * crisp on the red header without looking like a plain label.
 */
public class BrandLabel extends JComponent {

    private static final String FIRST = "BET";
    private static final String SECOND = "LIFE";
    private static final float LETTER_SPACING = 0.04f;
    private static final float OUTLINE_WIDTH = 2.2f;
    private static final int SHADOW_OFFSET = 1;

    public BrandLabel() {
        Map<TextAttribute, Object> attributes = new HashMap<>();
        attributes.put(TextAttribute.TRACKING, LETTER_SPACING);
        setFont(Theme.BRAND.deriveFont(attributes));
        setPreferredSize(new Dimension(160, Theme.HEADER_HEIGHT));
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);

        Font font = getFont();
        FontRenderContext context = g2.getFontRenderContext();
        Shape first = font.createGlyphVector(context, FIRST).getOutline();
        Shape second = font.createGlyphVector(context, SECOND).getOutline();
        Rectangle2D firstBounds = first.getBounds2D();
        Rectangle2D wholeBounds = font.createGlyphVector(context, FIRST + SECOND).getOutline().getBounds2D();

        // Center the whole word geometrically inside this component.
        double x = (getWidth() - wholeBounds.getWidth()) / 2 - wholeBounds.getX();
        double y = (getHeight() - wholeBounds.getHeight()) / 2 - wholeBounds.getY();
        double secondX = x + firstBounds.getWidth() + firstBounds.getX() + font.getSize() * LETTER_SPACING;

        paintWord(g2, first, x, y, Theme.ON_DARK);
        paintWord(g2, second, secondX, y, Theme.BRAND_ACCENT);
        g2.dispose();
    }

    /** Shadow, then outline, then fill: the order keeps the outline crisp around the fill. */
    private static void paintWord(Graphics2D g2, Shape glyphs, double x, double y, java.awt.Color fill) {
        Shape shadow = AffineTransform.getTranslateInstance(x + SHADOW_OFFSET, y + SHADOW_OFFSET)
                .createTransformedShape(glyphs);
        Shape word = AffineTransform.getTranslateInstance(x, y).createTransformedShape(glyphs);

        g2.setStroke(new BasicStroke(OUTLINE_WIDTH, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        g2.setColor(Theme.BRAND_OUTLINE);
        g2.draw(shadow);
        g2.draw(word);
        g2.setColor(fill);
        g2.fill(word);
    }
}
