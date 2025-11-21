#!/usr/bin/env python3
"""
ImageDiff - A simple image comparison tool
Compares two images and highlights differences with color coding:
- Black: Identical pixels (default)
- Red: Only present in image A (not in B)
- Green: Only present in image B (not in A)
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, colorchooser
from tkinterdnd2 import DND_FILES, TkinterDnD
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from pathlib import Path
from datetime import datetime
import os

# Try to import pdf2image for PDF support
try:
    from pdf2image import convert_from_path
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False


class ImageDiffApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Zeichnung A-B Vergleich")
        self.root.geometry("1000x1000")
        self.root.resizable(True, True)

        # Configure modern Windows 11 style
        self.setup_styles()

        # Image variables
        self.image_a_path = None
        self.image_b_path = None
        self.result_image = None

        # Color settings for comparison (RGB tuples)
        self.color_identical = (0, 0, 0)          # Black (default)
        self.color_diff_a = (255, 0, 0)           # Red
        self.color_diff_b = (0, 255, 0)           # Green

        # Supported formats
        self.supported_formats = [
            ('All Supported', '*.jpg *.jpeg *.png *.bmp *.tiff *.tif *.gif *.webp' + (' *.pdf' if PDF_SUPPORT else '')),
            ('JPEG', '*.jpg *.jpeg'),
            ('PNG', '*.png'),
            ('BMP', '*.bmp'),
            ('TIFF', '*.tiff *.tif'),
            ('GIF', '*.gif'),
            ('WEBP', '*.webp'),
        ]
        if PDF_SUPPORT:
            self.supported_formats.append(('PDF', '*.pdf'))

        self.setup_ui()

    def setup_styles(self):
        """Configure modern Windows 11-inspired styles"""
        style = ttk.Style()

        # Try to use a modern theme
        try:
            style.theme_use('vista')  # Windows-like theme
        except:
            try:
                style.theme_use('clam')  # Alternative modern theme
            except:
                pass  # Use default theme

        # Configure colors - Windows 11 inspired
        bg_color = '#f3f3f3'
        fg_color = '#202020'
        accent_color = '#0078d4'

        self.root.configure(bg=bg_color)

        # Configure ttk styles
        style.configure('TFrame', background=bg_color)
        style.configure('TLabel', background=bg_color, foreground=fg_color, font=('Segoe UI', 10))
        style.configure('TLabelframe', background=bg_color, foreground=fg_color, font=('Segoe UI', 10, 'bold'))
        style.configure('TLabelframe.Label', background=bg_color, foreground=fg_color, font=('Segoe UI', 10, 'bold'))
        style.configure('TButton', font=('Segoe UI', 10), padding=8)
        style.configure('Accent.TButton', font=('Segoe UI', 10, 'bold'), padding=8)

        # Configure status label style
        style.configure('Status.TLabel', font=('Segoe UI', 14), background='#ffffff',
                       foreground=fg_color, relief=tk.FLAT, padding=15)
        style.configure('StatusComplete.TLabel', font=('Segoe UI', 14, 'bold'),
                       background='#d4edda', foreground='#155724', relief=tk.FLAT, padding=15)

    def setup_ui(self):
        """Setup the main user interface"""
        # Main container
        main_frame = ttk.Frame(self.root, padding="15")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)

        # Title
        title_label = ttk.Label(main_frame, text="Zeichnung A-B Vergleich",
                                font=('Segoe UI', 18, 'bold'))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))

        # Drop zones container
        dropzones_frame = ttk.Frame(main_frame)
        dropzones_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 15))
        dropzones_frame.columnconfigure(0, weight=1)
        dropzones_frame.columnconfigure(1, weight=1)

        # Image A drop zone
        self.create_drop_zone(dropzones_frame, "Zeichnung A", 0, 'a')

        # Image B drop zone
        self.create_drop_zone(dropzones_frame, "Zeichnung B", 1, 'b')

        # Status bar (moved here, between images and settings)
        status_frame = ttk.Frame(main_frame)
        status_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(10, 15))
        status_frame.columnconfigure(0, weight=1)

        self.status_var = tk.StringVar(value="Bereit. Bitte laden Sie zwei Zeichnungen zum Vergleichen.")
        self.status_label = ttk.Label(status_frame, textvariable=self.status_var,
                                      style='Status.TLabel', anchor=tk.CENTER)
        self.status_label.grid(row=0, column=0, sticky=(tk.W, tk.E))

        # Settings frame
        settings_frame = ttk.LabelFrame(main_frame, text="Vergleichseinstellungen", padding="15")
        settings_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 15))
        settings_frame.columnconfigure(1, weight=1)

        # Sensitivity slider
        ttk.Label(settings_frame, text="Empfindlichkeit:", font=('Segoe UI', 10)).grid(
            row=0, column=0, sticky=tk.W, padx=(0, 10))

        self.sensitivity_var = tk.IntVar(value=80)
        self.sensitivity_slider = ttk.Scale(settings_frame, from_=0, to=100,
                                           orient=tk.HORIZONTAL, variable=self.sensitivity_var,
                                           command=self.update_sensitivity_label)
        self.sensitivity_slider.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(0, 10))

        self.sensitivity_label = ttk.Label(settings_frame, text="80%", font=('Segoe UI', 10, 'bold'))
        self.sensitivity_label.grid(row=0, column=2, sticky=tk.W)

        # Tooltip
        tooltip = ttk.Label(settings_frame, text="(Höherer Wert = strengerer Vergleich)",
                           font=('Segoe UI', 9, 'italic'))
        tooltip.grid(row=1, column=1, sticky=tk.W, pady=(5, 0))

        # Color settings section
        ttk.Separator(settings_frame, orient='horizontal').grid(row=2, column=0, columnspan=3,
                                                                sticky=(tk.W, tk.E), pady=(15, 10))

        ttk.Label(settings_frame, text="Farbeinstellungen:", font=('Segoe UI', 11, 'bold')).grid(
            row=3, column=0, columnspan=3, sticky=tk.W, pady=(0, 10))

        # Identical pixels color
        ttk.Label(settings_frame, text="Identisch:", font=('Segoe UI', 10)).grid(
            row=4, column=0, sticky=tk.W)
        self.color_identical_btn = tk.Button(settings_frame, text="   ",
                                             bg=self.rgb_to_hex(self.color_identical),
                                             command=lambda: self.choose_color('identical'),
                                             width=4, height=1, relief=tk.RAISED,
                                             borderwidth=2, cursor='hand2')
        self.color_identical_btn.grid(row=4, column=1, sticky=tk.W, padx=(0, 10))
        ttk.Label(settings_frame, text="(Pixel in beiden Zeichnungen identisch)",
                 font=('Segoe UI', 9, 'italic')).grid(row=4, column=2, sticky=tk.W)

        # Difference A color
        ttk.Label(settings_frame, text="Unterschied A:", font=('Segoe UI', 10)).grid(
            row=5, column=0, sticky=tk.W, pady=(8, 0))
        self.color_diff_a_btn = tk.Button(settings_frame, text="   ",
                                          bg=self.rgb_to_hex(self.color_diff_a),
                                          command=lambda: self.choose_color('diff_a'),
                                          width=4, height=1, relief=tk.RAISED,
                                          borderwidth=2, cursor='hand2')
        self.color_diff_a_btn.grid(row=5, column=1, sticky=tk.W, padx=(0, 10), pady=(8, 0))
        ttk.Label(settings_frame, text="(Nur in Zeichnung A vorhanden)",
                 font=('Segoe UI', 9, 'italic')).grid(row=5, column=2, sticky=tk.W, pady=(8, 0))

        # Difference B color
        ttk.Label(settings_frame, text="Unterschied B:", font=('Segoe UI', 10)).grid(
            row=6, column=0, sticky=tk.W, pady=(8, 0))
        self.color_diff_b_btn = tk.Button(settings_frame, text="   ",
                                          bg=self.rgb_to_hex(self.color_diff_b),
                                          command=lambda: self.choose_color('diff_b'),
                                          width=4, height=1, relief=tk.RAISED,
                                          borderwidth=2, cursor='hand2')
        self.color_diff_b_btn.grid(row=6, column=1, sticky=tk.W, padx=(0, 10), pady=(8, 0))
        ttk.Label(settings_frame, text="(Nur in Zeichnung B vorhanden)",
                 font=('Segoe UI', 9, 'italic')).grid(row=6, column=2, sticky=tk.W, pady=(8, 0))

        # Action buttons
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.grid(row=4, column=0, columnspan=2, pady=(15, 10))

        self.compare_btn = ttk.Button(buttons_frame, text="Zeichnungen vergleichen",
                                      command=self.compare_images, style='Accent.TButton')
        self.compare_btn.pack(side=tk.LEFT, padx=8)

        self.reset_btn = ttk.Button(buttons_frame, text="Zurücksetzen", command=self.reset_all)
        self.reset_btn.pack(side=tk.LEFT, padx=8)

        self.save_btn = ttk.Button(buttons_frame, text="Ergebnis speichern",
                                   command=self.save_result, state=tk.DISABLED)
        self.save_btn.pack(side=tk.LEFT, padx=8)

        # Configure grid weights
        main_frame.columnconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)

    def create_drop_zone(self, parent, label_text, column, image_type):
        """Create a drop zone for image loading"""
        frame = ttk.Frame(parent, relief=tk.SOLID, borderwidth=1)
        frame.grid(row=0, column=column, sticky=(tk.W, tk.E, tk.N, tk.S), padx=8)

        # Label
        label = ttk.Label(frame, text=label_text, font=('Segoe UI', 13, 'bold'))
        label.pack(pady=(15, 8))

        # Drop zone canvas
        canvas = tk.Canvas(frame, width=350, height=160, bg='#fafafa',
                          highlightthickness=2, highlightbackground='#d0d0d0')
        canvas.pack(padx=15, pady=8)

        # Drop zone text
        canvas.create_text(175, 65, text="Drag & Drop Zeichnung hier",
                          font=('Segoe UI', 11), fill='#666666', tags='droptext')
        canvas.create_text(175, 95, text="oder",
                          font=('Segoe UI', 9), fill='#888888', tags='droptext')

        # File name label
        filename_var = tk.StringVar(value="Keine Datei geladen")
        filename_label = ttk.Label(frame, textvariable=filename_var,
                                  font=('Segoe UI', 9), foreground='#666666')
        filename_label.pack(pady=(5, 8))

        # Browse button
        browse_btn = ttk.Button(frame, text="Durchsuchen...",
                               command=lambda: self.browse_file(image_type))
        browse_btn.pack(pady=(0, 15))

        # Enable drag and drop
        canvas.drop_target_register(DND_FILES)
        canvas.dnd_bind('<<Drop>>', lambda e: self.drop_file(e, image_type))
        canvas.dnd_bind('<<DragEnter>>', lambda e: self.drag_enter(canvas))
        canvas.dnd_bind('<<DragLeave>>', lambda e: self.drag_leave(canvas))

        # Store references
        if image_type == 'a':
            self.canvas_a = canvas
            self.filename_a_var = filename_var
        else:
            self.canvas_b = canvas
            self.filename_b_var = filename_var

    def drag_enter(self, canvas):
        """Visual feedback when dragging over drop zone"""
        canvas.configure(bg='#e3f2fd', highlightbackground='#0078d4')

    def drag_leave(self, canvas):
        """Reset visual feedback when leaving drop zone"""
        canvas.configure(bg='#fafafa', highlightbackground='#d0d0d0')

    def drop_file(self, event, image_type):
        """Handle file drop event"""
        file_path = event.data
        # Clean up the path (remove curly braces if present)
        file_path = file_path.strip('{}')

        # Reset canvas appearance
        canvas = self.canvas_a if image_type == 'a' else self.canvas_b
        self.drag_leave(canvas)

        self.load_image(file_path, image_type)

    def browse_file(self, image_type):
        """Open file dialog to browse for image"""
        file_path = filedialog.askopenfilename(
            title=f"Zeichnung {image_type.upper()} auswählen",
            filetypes=self.supported_formats
        )

        if file_path:
            self.load_image(file_path, image_type)

    def load_image(self, file_path, image_type):
        """Load and validate image file"""
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                messagebox.showerror("Fehler", f"Datei nicht gefunden: {file_path}")
                return

            # Check file extension
            ext = Path(file_path).suffix.lower()
            supported_exts = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif', '.webp']
            if PDF_SUPPORT:
                supported_exts.append('.pdf')

            if ext not in supported_exts:
                messagebox.showerror("Fehler", f"Nicht unterstütztes Dateiformat: {ext}")
                return

            # Try to open and validate image
            if ext == '.pdf':
                if not PDF_SUPPORT:
                    messagebox.showerror("Fehler", "PDF-Unterstützung nicht verfügbar. Bitte installieren Sie pdf2image und poppler.")
                    return
                # Convert first page of PDF to image
                try:
                    images = convert_from_path(file_path, first_page=1, last_page=1)
                    if not images:
                        messagebox.showerror("Fehler", "PDF-Datei konnte nicht geladen werden.")
                        return
                    # Just validate, don't store the converted image yet
                    test_img = images[0]
                except Exception as pdf_error:
                    error_msg = str(pdf_error).lower()
                    if "unable to get page count" in error_msg or "poppler" in error_msg:
                        messagebox.showerror("Poppler nicht gefunden",
                            "Poppler ist nicht installiert oder nicht im PATH.\n\n"
                            "Windows Installation:\n"
                            "1. Download: github.com/oschwartz10612/poppler-windows/releases\n"
                            "2. Entpacken nach C:\\poppler\n"
                            "3. Zu PATH hinzufügen: C:\\poppler\\Library\\bin\n"
                            "4. CMD neu starten und 'pdftoppm -v' testen\n\n"
                            "Alternativ: Verwenden Sie PNG/JPG statt PDF.")
                    else:
                        messagebox.showerror("PDF Fehler", f"PDF konnte nicht geladen werden:\n{str(pdf_error)}")
                    return
            else:
                test_img = Image.open(file_path)
                test_img.verify()  # Verify it's a valid image

            # Store path
            if image_type == 'a':
                self.image_a_path = file_path
                self.filename_a_var.set(Path(file_path).name)
            else:
                self.image_b_path = file_path
                self.filename_b_var.set(Path(file_path).name)

            self.update_status(f"{Path(file_path).name} als Zeichnung {image_type.upper()} geladen", complete=False)

        except Exception as e:
            messagebox.showerror("Fehler", f"Fehler beim Laden der Zeichnung: {str(e)}")

    def rgb_to_hex(self, rgb):
        """Convert RGB tuple to hex color string"""
        return f'#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}'

    def hex_to_rgb(self, hex_color):
        """Convert hex color string to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def choose_color(self, color_type):
        """Open color chooser dialog"""
        # Get current color
        if color_type == 'identical':
            current_color = self.rgb_to_hex(self.color_identical)
        elif color_type == 'diff_a':
            current_color = self.rgb_to_hex(self.color_diff_a)
        else:  # diff_b
            current_color = self.rgb_to_hex(self.color_diff_b)

        # Open color chooser
        color = colorchooser.askcolor(
            color=current_color,
            title=f"Farbe für {color_type.replace('_', ' ').title()} auswählen"
        )

        if color[1]:  # color[1] is the hex string
            rgb = self.hex_to_rgb(color[1])

            # Update color variable and button
            if color_type == 'identical':
                self.color_identical = rgb
                self.color_identical_btn.config(bg=color[1])
            elif color_type == 'diff_a':
                self.color_diff_a = rgb
                self.color_diff_a_btn.config(bg=color[1])
            else:  # diff_b
                self.color_diff_b = rgb
                self.color_diff_b_btn.config(bg=color[1])

    def update_sensitivity_label(self, value):
        """Update sensitivity label when slider moves"""
        self.sensitivity_label.config(text=f"{int(float(value))}%")

    def compare_images(self):
        """Perform image comparison"""
        # Validate both images are loaded
        if not self.image_a_path or not self.image_b_path:
            if not self.image_a_path and not self.image_b_path:
                messagebox.showwarning("Warnung", "Bitte laden Sie beide Zeichnungen vor dem Vergleichen.")
            elif not self.image_a_path:
                messagebox.showwarning("Warnung", "Bitte laden Sie Zeichnung A vor dem Vergleichen.")
            else:
                messagebox.showwarning("Warnung", "Bitte laden Sie Zeichnung B vor dem Vergleichen.")
            return

        try:
            # Show loading cursor (wait/watch)
            self.root.config(cursor="watch")
            self.update_status("Zeichnungen werden verglichen...", complete=False)
            self.root.update()

            # Load images
            img_a = self.load_image_file(self.image_a_path)
            img_b = self.load_image_file(self.image_b_path)

            # Convert to RGB if necessary
            if img_a.mode != 'RGB':
                img_a = img_a.convert('RGB')
            if img_b.mode != 'RGB':
                img_b = img_b.convert('RGB')

            # Scale to same size (scale larger image down)
            target_size = (
                min(img_a.width, img_b.width),
                min(img_a.height, img_b.height)
            )

            if img_a.size != target_size:
                img_a = img_a.resize(target_size, Image.Resampling.LANCZOS)
            if img_b.size != target_size:
                img_b = img_b.resize(target_size, Image.Resampling.LANCZOS)

            # Perform comparison
            self.result_image = self.perform_comparison(img_a, img_b)

            # Enable save button
            self.save_btn.config(state=tk.NORMAL)

            # Restore normal cursor
            self.root.config(cursor="")

            # Update status with success highlight (no popup)
            self.update_status("Vergleich abgeschlossen! Sie können das Ergebnis jetzt speichern.", complete=True)

        except Exception as e:
            # Restore normal cursor on error
            self.root.config(cursor="")
            messagebox.showerror("Fehler", f"Vergleich fehlgeschlagen: {str(e)}")
            self.update_status("Vergleich fehlgeschlagen.", complete=False)

    def load_image_file(self, file_path):
        """Load image from file, handling PDF conversion"""
        ext = Path(file_path).suffix.lower()

        if ext == '.pdf':
            try:
                images = convert_from_path(file_path, first_page=1, last_page=1)
                return images[0]
            except Exception as e:
                error_msg = str(e).lower()
                if "unable to get page count" in error_msg or "poppler" in error_msg:
                    raise Exception("Poppler nicht gefunden. Bitte installieren Sie Poppler und fügen Sie es zum PATH hinzu.")
                else:
                    raise Exception(f"PDF Fehler: {str(e)}")
        else:
            return Image.open(file_path)

    def perform_comparison(self, img_a, img_b):
        """Compare two images and create color-coded difference image"""
        # Convert images to numpy arrays
        arr_a = np.array(img_a, dtype=np.float32)
        arr_b = np.array(img_b, dtype=np.float32)

        # Calculate sensitivity threshold (0-100% -> 0-255)
        sensitivity = self.sensitivity_var.get()
        threshold = (100 - sensitivity) / 100 * 255

        # Calculate absolute difference for each channel
        diff = np.abs(arr_a - arr_b)

        # Calculate magnitude of difference (Euclidean distance in RGB space)
        diff_magnitude = np.sqrt(np.sum(diff ** 2, axis=2))

        # Create result image
        result = np.zeros_like(arr_a, dtype=np.uint8)

        # Detect white pixels (pixels where all RGB values are >= 250 in both images)
        white_threshold = 250
        white_in_a = np.all(arr_a >= white_threshold, axis=2)
        white_in_b = np.all(arr_b >= white_threshold, axis=2)
        white_mask = white_in_a & white_in_b

        # Pixels where difference is below threshold (identical)
        identical_mask = diff_magnitude <= threshold

        # For white pixels in both images: keep them white
        result[white_mask] = [255, 255, 255]

        # For identical non-white pixels: use custom color
        identical_non_white_mask = identical_mask & ~white_mask
        result[identical_non_white_mask] = list(self.color_identical)

        # For different pixels: determine if only in A or only in B
        different_mask = (~identical_mask) & (~white_mask)

        # Threshold to determine if pixel is "present" (dark/colored) or "absent" (white/light)
        presence_threshold = 240

        brightness_a = np.mean(arr_a, axis=2)
        brightness_b = np.mean(arr_b, axis=2)

        # Pixel is "present" if brightness < threshold, "absent" if >= threshold
        present_in_a = brightness_a < presence_threshold
        present_in_b = brightness_b < presence_threshold

        # Difference A: present in A but absent in B (only in A)
        diff_a_mask = different_mask & present_in_a & (~present_in_b)
        result[diff_a_mask] = list(self.color_diff_a)

        # Difference B: present in B but absent in A (only in B)
        diff_b_mask = different_mask & present_in_b & (~present_in_a)
        result[diff_b_mask] = list(self.color_diff_b)

        # Remaining different pixels that are present in both
        # Color based on which is darker/more prominent
        remaining_mask = different_mask & present_in_a & present_in_b
        darker_in_a = remaining_mask & (brightness_a < brightness_b)
        darker_in_b = remaining_mask & (brightness_a >= brightness_b)
        result[darker_in_a] = list(self.color_diff_a)
        result[darker_in_b] = list(self.color_diff_b)

        # Convert back to PIL Image
        result_img = Image.fromarray(result, mode='RGB')

        return result_img

    def save_result(self):
        """Save comparison result to file"""
        if self.result_image is None:
            messagebox.showwarning("Warnung", "Kein Vergleichsergebnis zum Speichern. Bitte vergleichen Sie zuerst die Zeichnungen.")
            return

        # Generate default filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        default_filename = f"vergleich_{timestamp}"

        # File dialog with format selection
        file_path = filedialog.asksaveasfilename(
            defaultextension=".png",
            initialfile=default_filename,
            filetypes=[
                ('PNG', '*.png'),
                ('JPEG', '*.jpg'),
                ('BMP', '*.bmp'),
                ('TIFF', '*.tiff')
            ],
            title="Vergleichsergebnis speichern"
        )

        if not file_path:
            return

        try:
            # Determine format from extension
            ext = Path(file_path).suffix.lower()

            # Handle JPEG quality
            if ext in ['.jpg', '.jpeg']:
                # Show quality dialog
                quality = self.ask_jpeg_quality()
                if quality is None:
                    return
                self.result_image.save(file_path, 'JPEG', quality=quality)
            else:
                self.result_image.save(file_path)

            # Update status (no popup)
            self.update_status(f"Ergebnis erfolgreich gespeichert: {Path(file_path).name}", complete=True)

        except Exception as e:
            messagebox.showerror("Fehler", f"Fehler beim Speichern: {str(e)}")

    def ask_jpeg_quality(self):
        """Show dialog to select JPEG quality"""
        dialog = tk.Toplevel(self.root)
        dialog.title("JPEG Qualität")
        dialog.geometry("380x160")
        dialog.resizable(False, False)
        dialog.transient(self.root)
        dialog.grab_set()

        result = {'quality': None}

        # Center dialog
        dialog.update_idletasks()
        x = (dialog.winfo_screenwidth() // 2) - (dialog.winfo_width() // 2)
        y = (dialog.winfo_screenheight() // 2) - (dialog.winfo_height() // 2)
        dialog.geometry(f"+{x}+{y}")

        # Content
        frame = ttk.Frame(dialog, padding="20")
        frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(frame, text="JPEG Qualität auswählen:", font=('Segoe UI', 11, 'bold')).pack(pady=(0, 10))

        quality_var = tk.IntVar(value=90)

        slider_frame = ttk.Frame(frame)
        slider_frame.pack(fill=tk.X, pady=10)

        quality_slider = ttk.Scale(slider_frame, from_=0, to=100, orient=tk.HORIZONTAL,
                                   variable=quality_var)
        quality_slider.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))

        quality_label = ttk.Label(slider_frame, text="90%", font=('Segoe UI', 10, 'bold'))
        quality_label.pack(side=tk.LEFT)

        def update_quality_label(value):
            quality_label.config(text=f"{int(float(value))}%")

        quality_slider.config(command=update_quality_label)

        ttk.Label(frame, text="(Höher = bessere Qualität, größere Datei)",
                 font=('Segoe UI', 9, 'italic')).pack()

        # Buttons
        btn_frame = ttk.Frame(frame)
        btn_frame.pack(pady=(15, 0))

        def on_ok():
            result['quality'] = quality_var.get()
            dialog.destroy()

        def on_cancel():
            dialog.destroy()

        ttk.Button(btn_frame, text="OK", command=on_ok).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Abbrechen", command=on_cancel).pack(side=tk.LEFT, padx=5)

        dialog.wait_window()

        return result['quality']

    def reset_all(self):
        """Reset all images and comparison"""
        self.image_a_path = None
        self.image_b_path = None
        self.result_image = None

        self.filename_a_var.set("Keine Datei geladen")
        self.filename_b_var.set("Keine Datei geladen")

        self.save_btn.config(state=tk.DISABLED)
        self.sensitivity_var.set(80)

        self.update_status("Zurückgesetzt. Bereit für neuen Vergleich.", complete=False)

    def update_status(self, message, complete=False):
        """Update status bar message with optional success highlighting"""
        self.status_var.set(message)

        # Apply style based on completion status
        if complete:
            self.status_label.configure(style='StatusComplete.TLabel')
        else:
            self.status_label.configure(style='Status.TLabel')

        self.root.update()


def main():
    """Main entry point"""
    try:
        root = TkinterDnD.Tk()
    except Exception:
        # Fallback to regular Tk if TkinterDnD is not available
        root = tk.Tk()
        messagebox.showerror("Fehler",
            "TkinterDnD2 ist erforderlich für Drag & Drop.\n"
            "Bitte installieren: pip install tkinterdnd2\n\n"
            "Die Anwendung startet ohne Drag & Drop Support.")

    app = ImageDiffApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
