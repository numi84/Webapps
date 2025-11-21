#!/usr/bin/env python3
"""
ImageDiff - A simple image comparison tool
Compares two images and highlights differences with color coding:
- Yellow: Identical pixels
- Red: Different in image A
- Green: Different in image B
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
        self.root.title("ImageDiff")
        self.root.geometry("900x700")
        self.root.resizable(True, True)

        # Image variables
        self.image_a_path = None
        self.image_b_path = None
        self.result_image = None

        # Color settings for comparison (RGB tuples)
        self.color_identical = (255, 255, 0)  # Yellow
        self.color_diff_a = (255, 0, 0)       # Red
        self.color_diff_b = (0, 255, 0)       # Green

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

    def setup_ui(self):
        """Setup the main user interface"""
        # Main container
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)

        # Title
        title_label = ttk.Label(main_frame, text="ImageDiff - Image Comparison Tool",
                                font=('Arial', 16, 'bold'))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))

        # Drop zones container
        dropzones_frame = ttk.Frame(main_frame)
        dropzones_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        dropzones_frame.columnconfigure(0, weight=1)
        dropzones_frame.columnconfigure(1, weight=1)

        # Image A drop zone
        self.create_drop_zone(dropzones_frame, "Image A", 0, 'a')

        # Image B drop zone
        self.create_drop_zone(dropzones_frame, "Image B", 1, 'b')

        # Settings frame
        settings_frame = ttk.LabelFrame(main_frame, text="Comparison Settings", padding="10")
        settings_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(10, 10))
        settings_frame.columnconfigure(1, weight=1)

        # Sensitivity slider
        ttk.Label(settings_frame, text="Sensitivity:").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))

        self.sensitivity_var = tk.IntVar(value=80)
        self.sensitivity_slider = ttk.Scale(settings_frame, from_=0, to=100,
                                           orient=tk.HORIZONTAL, variable=self.sensitivity_var,
                                           command=self.update_sensitivity_label)
        self.sensitivity_slider.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(0, 10))

        self.sensitivity_label = ttk.Label(settings_frame, text="80%")
        self.sensitivity_label.grid(row=0, column=2, sticky=tk.W)

        # Tooltip
        tooltip = ttk.Label(settings_frame, text="(Higher value = more strict comparison)",
                           font=('Arial', 9, 'italic'))
        tooltip.grid(row=1, column=1, sticky=tk.W, pady=(5, 0))

        # Color settings section
        ttk.Separator(settings_frame, orient='horizontal').grid(row=2, column=0, columnspan=3,
                                                                sticky=(tk.W, tk.E), pady=(15, 10))

        ttk.Label(settings_frame, text="Color Settings:", font=('Arial', 10, 'bold')).grid(
            row=3, column=0, columnspan=3, sticky=tk.W, pady=(0, 10))

        # Identical pixels color
        ttk.Label(settings_frame, text="Identical:").grid(row=4, column=0, sticky=tk.W)
        self.color_identical_btn = tk.Button(settings_frame, text="   ",
                                             bg=self.rgb_to_hex(self.color_identical),
                                             command=lambda: self.choose_color('identical'),
                                             width=3, relief=tk.RAISED, borderwidth=2)
        self.color_identical_btn.grid(row=4, column=1, sticky=tk.W, padx=(0, 5))
        ttk.Label(settings_frame, text="(Pixels identical in both images)",
                 font=('Arial', 8, 'italic')).grid(row=4, column=2, sticky=tk.W)

        # Difference A color
        ttk.Label(settings_frame, text="Difference A:").grid(row=5, column=0, sticky=tk.W, pady=(5, 0))
        self.color_diff_a_btn = tk.Button(settings_frame, text="   ",
                                          bg=self.rgb_to_hex(self.color_diff_a),
                                          command=lambda: self.choose_color('diff_a'),
                                          width=3, relief=tk.RAISED, borderwidth=2)
        self.color_diff_a_btn.grid(row=5, column=1, sticky=tk.W, padx=(0, 5), pady=(5, 0))
        ttk.Label(settings_frame, text="(Pixels brighter in Image A)",
                 font=('Arial', 8, 'italic')).grid(row=5, column=2, sticky=tk.W, pady=(5, 0))

        # Difference B color
        ttk.Label(settings_frame, text="Difference B:").grid(row=6, column=0, sticky=tk.W, pady=(5, 0))
        self.color_diff_b_btn = tk.Button(settings_frame, text="   ",
                                          bg=self.rgb_to_hex(self.color_diff_b),
                                          command=lambda: self.choose_color('diff_b'),
                                          width=3, relief=tk.RAISED, borderwidth=2)
        self.color_diff_b_btn.grid(row=6, column=1, sticky=tk.W, padx=(0, 5), pady=(5, 0))
        ttk.Label(settings_frame, text="(Pixels brighter in Image B)",
                 font=('Arial', 8, 'italic')).grid(row=6, column=2, sticky=tk.W, pady=(5, 0))

        # Action buttons
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.grid(row=3, column=0, columnspan=2, pady=(20, 10))

        self.compare_btn = ttk.Button(buttons_frame, text="Compare Images",
                                      command=self.compare_images, style='Accent.TButton')
        self.compare_btn.pack(side=tk.LEFT, padx=5)

        self.reset_btn = ttk.Button(buttons_frame, text="Reset", command=self.reset_all)
        self.reset_btn.pack(side=tk.LEFT, padx=5)

        self.save_btn = ttk.Button(buttons_frame, text="Save Result",
                                   command=self.save_result, state=tk.DISABLED)
        self.save_btn.pack(side=tk.LEFT, padx=5)

        # Status bar
        self.status_var = tk.StringVar(value="Ready. Please load two images to compare.")
        status_label = ttk.Label(main_frame, textvariable=self.status_var,
                                relief=tk.SUNKEN, anchor=tk.W)
        status_label.grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(10, 0))

        # Configure grid weights
        main_frame.columnconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)

    def create_drop_zone(self, parent, label_text, column, image_type):
        """Create a drop zone for image loading"""
        frame = ttk.Frame(parent, relief=tk.GROOVE, borderwidth=2)
        frame.grid(row=0, column=column, sticky=(tk.W, tk.E, tk.N, tk.S), padx=5)

        # Label
        label = ttk.Label(frame, text=label_text, font=('Arial', 12, 'bold'))
        label.pack(pady=(10, 5))

        # Drop zone canvas
        canvas = tk.Canvas(frame, width=300, height=150, bg='#f0f0f0',
                          highlightthickness=2, highlightbackground='#cccccc')
        canvas.pack(padx=10, pady=5)

        # Drop zone text
        canvas.create_text(150, 60, text="Drag & Drop Image Here",
                          font=('Arial', 11), fill='#666666', tags='droptext')
        canvas.create_text(150, 90, text="or",
                          font=('Arial', 9), fill='#666666', tags='droptext')

        # File name label
        filename_var = tk.StringVar(value="No file loaded")
        filename_label = ttk.Label(frame, textvariable=filename_var,
                                  font=('Arial', 9), foreground='#666666')
        filename_label.pack(pady=(0, 5))

        # Browse button
        browse_btn = ttk.Button(frame, text="Browse...",
                               command=lambda: self.browse_file(image_type))
        browse_btn.pack(pady=(0, 10))

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
        canvas.configure(bg='#e0f0ff', highlightbackground='#4CAF50')

    def drag_leave(self, canvas):
        """Reset visual feedback when leaving drop zone"""
        canvas.configure(bg='#f0f0f0', highlightbackground='#cccccc')

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
            title=f"Select Image {image_type.upper()}",
            filetypes=self.supported_formats
        )

        if file_path:
            self.load_image(file_path, image_type)

    def load_image(self, file_path, image_type):
        """Load and validate image file"""
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                messagebox.showerror("Error", f"File not found: {file_path}")
                return

            # Check file extension
            ext = Path(file_path).suffix.lower()
            supported_exts = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif', '.webp']
            if PDF_SUPPORT:
                supported_exts.append('.pdf')

            if ext not in supported_exts:
                messagebox.showerror("Error", f"Unsupported file format: {ext}")
                return

            # Try to open and validate image
            if ext == '.pdf':
                if not PDF_SUPPORT:
                    messagebox.showerror("Error", "PDF support not available. Install pdf2image and poppler.")
                    return
                # Convert first page of PDF to image
                images = convert_from_path(file_path, first_page=1, last_page=1)
                if not images:
                    messagebox.showerror("Error", "Could not load PDF file.")
                    return
                # Just validate, don't store the converted image yet
                test_img = images[0]
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

            self.update_status(f"Loaded {Path(file_path).name} as Image {image_type.upper()}")

        except Exception as e:
            messagebox.showerror("Error", f"Failed to load image: {str(e)}")

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
            title=f"Choose color for {color_type.replace('_', ' ').title()}"
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
                messagebox.showwarning("Warning", "Please load both images before comparing.")
            elif not self.image_a_path:
                messagebox.showwarning("Warning", "Please load Image A before comparing.")
            else:
                messagebox.showwarning("Warning", "Please load Image B before comparing.")
            return

        try:
            self.update_status("Comparing images...")
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

            self.update_status("Comparison complete! You can now save the result.")
            messagebox.showinfo("Success", "Image comparison completed successfully!")

        except Exception as e:
            messagebox.showerror("Error", f"Comparison failed: {str(e)}")
            self.update_status("Comparison failed.")

    def load_image_file(self, file_path):
        """Load image from file, handling PDF conversion"""
        ext = Path(file_path).suffix.lower()

        if ext == '.pdf':
            images = convert_from_path(file_path, first_page=1, last_page=1)
            return images[0]
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

        # For different pixels: determine if more from A or B
        different_mask = (~identical_mask) & (~white_mask)

        brightness_a = np.mean(arr_a, axis=2)
        brightness_b = np.mean(arr_b, axis=2)

        # Difference A: brighter in A (or equal)
        diff_a_mask = different_mask & (brightness_a >= brightness_b)
        result[diff_a_mask] = list(self.color_diff_a)

        # Difference B: brighter in B
        diff_b_mask = different_mask & (brightness_a < brightness_b)
        result[diff_b_mask] = list(self.color_diff_b)

        # Convert back to PIL Image
        result_img = Image.fromarray(result, mode='RGB')

        return result_img

    def save_result(self):
        """Save comparison result to file"""
        if self.result_image is None:
            messagebox.showwarning("Warning", "No comparison result to save. Please compare images first.")
            return

        # Generate default filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        default_filename = f"comparison_{timestamp}"

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
            title="Save Comparison Result"
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

            self.update_status(f"Result saved to {Path(file_path).name}")
            messagebox.showinfo("Success", f"Comparison result saved successfully to:\n{file_path}")

        except Exception as e:
            messagebox.showerror("Error", f"Failed to save image: {str(e)}")

    def ask_jpeg_quality(self):
        """Show dialog to select JPEG quality"""
        dialog = tk.Toplevel(self.root)
        dialog.title("JPEG Quality")
        dialog.geometry("350x150")
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

        ttk.Label(frame, text="Select JPEG Quality:", font=('Arial', 10, 'bold')).pack(pady=(0, 10))

        quality_var = tk.IntVar(value=90)

        slider_frame = ttk.Frame(frame)
        slider_frame.pack(fill=tk.X, pady=10)

        quality_slider = ttk.Scale(slider_frame, from_=0, to=100, orient=tk.HORIZONTAL,
                                   variable=quality_var)
        quality_slider.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))

        quality_label = ttk.Label(slider_frame, text="90%")
        quality_label.pack(side=tk.LEFT)

        def update_quality_label(value):
            quality_label.config(text=f"{int(float(value))}%")

        quality_slider.config(command=update_quality_label)

        ttk.Label(frame, text="(Higher = better quality, larger file size)",
                 font=('Arial', 8, 'italic')).pack()

        # Buttons
        btn_frame = ttk.Frame(frame)
        btn_frame.pack(pady=(15, 0))

        def on_ok():
            result['quality'] = quality_var.get()
            dialog.destroy()

        def on_cancel():
            dialog.destroy()

        ttk.Button(btn_frame, text="OK", command=on_ok).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Cancel", command=on_cancel).pack(side=tk.LEFT, padx=5)

        dialog.wait_window()

        return result['quality']

    def reset_all(self):
        """Reset all images and comparison"""
        self.image_a_path = None
        self.image_b_path = None
        self.result_image = None

        self.filename_a_var.set("No file loaded")
        self.filename_b_var.set("No file loaded")

        self.save_btn.config(state=tk.DISABLED)
        self.sensitivity_var.set(80)

        self.update_status("Reset complete. Ready for new comparison.")

    def update_status(self, message):
        """Update status bar message"""
        self.status_var.set(message)
        self.root.update()


def main():
    """Main entry point"""
    try:
        root = TkinterDnD.Tk()
    except Exception:
        # Fallback to regular Tk if TkinterDnD is not available
        messagebox.showerror("Error",
            "TkinterDnD2 is required for drag & drop functionality.\n"
            "Please install it: pip install tkinterdnd2\n\n"
            "The application will start without drag & drop support.")
        root = tk.Tk()

    app = ImageDiffApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
