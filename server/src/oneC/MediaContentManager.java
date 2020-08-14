package oneC;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.OpenOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

public class MediaContentManager {

	private final Path staticFolder;

	public MediaContentManager(String mediaFolder) {
		this.staticFolder = Paths.get(mediaFolder);
	}

	public void saveFile(String dir, String filename, byte[] data, OpenOption... options) {
		try {
			Path p = Paths.get(staticFolder.toString(), dir, filename);
			Files.createDirectories(p.getParent());
			Files.write(p, data, options != null ? options
					: new OpenOption[] { StandardOpenOption.CREATE, StandardOpenOption.WRITE });
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public byte[] readFile(String dir, String filename) {
		final Path path = Paths.get(staticFolder.toString(), dir, filename);
		if (Files.exists(path)) {
			try {
				return Files.readAllBytes(path);
			} catch (IOException e) {
				e.printStackTrace();
			}
		} else {
			throw new RuntimeException("Filename is null or file does not exist");
		}
		return null;
	}

	//	public void saveImage(String dir, String filename, String base64, boolean splitHeader) {
	//		try {
	//			byte[] imgBytes;
	//			if (splitHeader) {
	//				imgBytes = Base64.getDecoder().decode(base64.split(",")[1]);
	//			} else {
	//				imgBytes = Base64.getDecoder().decode(base64);
	//			}
	//			ByteArrayInputStream in = new ByteArrayInputStream(imgBytes);
	//			BufferedImage img = ImageIO.read(in);
	//			int worh = Math.min(img.getWidth(), img.getHeight());
	//			img = img.getSubimage(0, 0, worh, worh);
	//			if (worh > 600) {
	//				img = resizeImg(img, 600, 600);
	//			}
	//			ByteArrayOutputStream out = new ByteArrayOutputStream();
	//			ImageIO.write(img, "jpg", out);
	//
	//			Files.write(Paths.get(staticFolder.toString(), dir, filename + ".jpg"), out.toByteArray(),
	//					StandardOpenOption.WRITE, StandardOpenOption.CREATE);
	//		} catch (Exception e) {
	//			e.printStackTrace();
	//		}
	//	}

	public void saveImage(String dir, String filename, byte[] data, OpenOption... options) {
		saveFile(dir, filename + ".jpg", data, options);
	}

	public byte[] readImage(String dir, String filename, String fallback) {
		byte[] data = null;
		try {
			data = readFile(dir, filename + ".jpg");
		} catch (Exception e) {
			data = readFile(dir, fallback + ".jpg");
		}
		return data;
	}

	public byte[] readImageSubfolder(String folder, String subfolder, String filename, String fallback) {
		byte[] data = null;
		try {
			data = readFile(Paths.get(folder, subfolder).toString(), filename + ".jpg");
		} catch (Exception e) {
			data = readFile(Paths.get(folder, subfolder).toString(), fallback + ".jpg");
		}
		return data;
	}

	//	public byte[] readImage(String dir, String filename, String fallback) {
	//		System.out.println(dir + " " + filename + " " + fallback);
	//		final Path imagePath = Paths.get(staticFolder.toString(), dir, filename + ".jpg");
	//		if (Files.exists(imagePath)) {
	//			try {
	//				return Files.readAllBytes(imagePath);
	//			} catch (IOException e) {
	//				e.printStackTrace();
	//			}
	//		} else {
	//			// Return fallback or error
	//			if (fallback != null) {
	//				final Path fallbackImagePath = Paths.get(staticFolder.toString(), dir, fallback + ".jpg");
	//				System.out.println(fallbackImagePath);
	//				if (Files.exists(fallbackImagePath)) {
	//					try {
	//						return Files.readAllBytes(fallbackImagePath);
	//					} catch (IOException e) {
	//						e.printStackTrace();
	//					}
	//				} else {
	//					throw new RuntimeException("Filename and fallback are null or file does not exist");
	//				}
	//			}
	//		}
	//		return null;
	//	}

	// I lost count of how many times i've copied this function
	public static BufferedImage resizeImg(BufferedImage img, int newW, int newH) {
		int w = img.getWidth();
		int h = img.getHeight();
		BufferedImage dimg = new BufferedImage(newW, newH, img.getType());
		Graphics2D g = dimg.createGraphics();
		g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
		g.drawImage(img, 0, 0, newW, newH, 0, 0, w, h, null);
		g.dispose();
		return dimg;
	}

}