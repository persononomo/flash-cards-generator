from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics


def create_flash_cards(word_pairs, rows, cols, main_color, opposite_color, filename="flash_cards.pdf"):
    # Register a font that supports Cyrillic characters
    pdfmetrics.registerFont(TTFont('DejaVuSans', 'src/resources/fonts/djsans/DejaVuSans.ttf'))

    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    margin = 2 * cm
    x_step = (width - 2 * margin) / cols
    y_step = (height - 2 * margin) / rows
    font_size = 12
    total_cards_per_page = rows * cols

    # Function to choose a contrasting text color
    def get_contrasting_color(bg_color):
        if bg_color.red + bg_color.green + bg_color.blue > 1.5:  # Simple brightness check
            return colors.black
        else:
            return colors.white

    def split_text(text, max_width):
        # Split text into lines, breaking long words if necessary
        def split_long_word(word, max_width):
            # Split a long word into parts that fit within the specified width
            parts = []
            while word:
                for i in range(len(word), 0, -1):
                    part = word[:i]
                    if c.stringWidth(part, 'DejaVuSans', font_size) <= max_width or i == 1:
                        parts.append(part)
                        word = word[i:]
                        break
            return parts

        words = text.split()
        lines = []
        current_line = ""

        for word in words:
            if c.stringWidth(word, 'DejaVuSans', font_size) > max_width:
                # If the current line is not empty, add it to lines
                if current_line:
                    lines.append(current_line)
                    current_line = ""
                # Split the long word and add its parts to lines
                lines.extend(split_long_word(word, max_width))
            elif not current_line:
                current_line = word
            elif c.stringWidth(current_line + ' ' + word, 'DejaVuSans', font_size) <= max_width:
                current_line += ' ' + word
            else:
                lines.append(current_line)
                current_line = word

        if current_line:
            lines.append(current_line)

        return lines

    # Function to draw words on a page
    def draw_page(words, opposite=False):
        y = height - margin - y_step
        fill_color = opposite_color if opposite else main_color
        text_color = get_contrasting_color(fill_color)
        for row in range(rows):
            x = margin
            for col in range(cols):
                index = row * cols + (cols - 1 - col if opposite else col)
                if index < len(words):
                    word = words[index]
                    # Draw border
                    c.setFillColor(fill_color)
                    c.setStrokeColor(colors.black)
                    c.rect(x, y, x_step, y_step, fill=1)
                    # Draw text
                    c.setFont('DejaVuSans', font_size)
                    c.setFillColor(text_color)
                    lines = split_text(word, x_step)
                    y_text = y + (y_step + (len(lines) - 1) * font_size) / 2
                    for line in lines:
                        text_width = c.stringWidth(line, 'DejaVuSans', font_size)
                        x_text = x + (x_step - text_width) / 2
                        y_text -= font_size
                        c.drawString(x_text, y_text, line)
                x += x_step
            y -= y_step
        c.showPage()

    # Split word pairs into pages and draw
    for page in range(0, len(word_pairs), total_cards_per_page):
        end_index = min(page + total_cards_per_page, len(word_pairs))
        main_words = [pair[0] for pair in word_pairs[page:end_index]]
        opposite_words = [pair[1] for pair in word_pairs[page:end_index]]

        draw_page(main_words)
        draw_page(opposite_words, opposite=True)

    c.save()


# Example usage
word_pairs_for_print = [("AAAAAAAAAAAAAA AAAAAAAAAAABBBAAAAAAAAAAAAAA AAAAAAAAAAAAAA", "AA"), ("B", "BB"), ("C", "CC"), ("D", "DD"), ("E", "EE"), ("F", "FF"), ("G", "GG"), ("H", "HH"),
                        ("A", "AA"), ("B", "BB"), ("C", "CC"), ("D", "DD"), ("AAAAAAAAAAAAAA AAAAAAAAAAABBBAAAAAAAAAAAAAA AAAAAAAAAAAAAA", "EE"), ("F", "FF"), ("G", "GG"), ("H", "HH")]
create_flash_cards(word_pairs_for_print, 5, 3, colors.lightblue, colors.lightgreen)
