package oneC;

import java.io.Serializable;

public class PostData implements Serializable {
	private static final long serialVersionUID = -6203828732903790875L;

	public final String author;
	public final int additional;
	public final String text;
	public final String[] attachments;
	public String postId;
	public final long date;

	public PostData(String author, int additional, String text, String[] attachments, long date,
			String postId) {
		this.author = author;
		this.additional = additional;
		this.text = text;
		this.attachments = attachments;
		this.date = date;
		this.postId = postId;
	}

}