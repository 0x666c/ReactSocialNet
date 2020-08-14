package oneC;

public enum Gender {

	MALE, FEMALE, OTHER;

	public static Gender getByIndex(int index) {
		if (index == 0) {
			return MALE;
		}
		else if (index == 1) {
			return FEMALE;
		}
		else if (index == 2) {
			return OTHER;
		}
		else {
			throw new RuntimeException("Invalid gender index: " + index);
		}
	}

}