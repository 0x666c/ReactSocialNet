package oneC;

public enum Status {

	// Return codes for methods. Don't want to use strings.

	// The action succeeded without errors
	SUCCESS,
	// The action failed without errors
	FAILURE,
	// Can't complete, because the action is forbidden
	FORBIDDEN,
	// The request returned an empty result
	EMPTY,
	// Reverse of the above
	NOT_EMPTY,
	// Same, but for a different case, used only togither with the above
	NOT_EMPTY_2,
	// An unexpected error happened
	ERROR;
	
	public static void unexpectedStatus(Status unexpected) {
		throw new RuntimeException(String.format("Expected actions, other than %s\n", unexpected.toString()));
	}
	
}