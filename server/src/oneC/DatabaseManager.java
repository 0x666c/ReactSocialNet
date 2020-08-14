package oneC;

import java.io.File;
import java.util.HashMap;
import java.util.Set;
import java.util.concurrent.ConcurrentMap;

import org.mapdb.DB;
import org.mapdb.DBMaker;
import org.mapdb.Serializer;

public class DatabaseManager {

	private final File pathToFolder;
	private final HashMap<String, DB> databases = new HashMap<>();

	public DatabaseManager(String pathToFolder) {
		this.pathToFolder = new File(pathToFolder);
	}

	public void createDatabase(String name, boolean noChecksum) {
		if (noChecksum) {
			databases.put(name, DBMaker.fileDB(pathToFolder.getAbsolutePath() + "\\" + name + ".db").fileMmapEnableIfSupported()
					.checksumHeaderBypass().make());
		} else {
			databases.put(name,
					DBMaker.fileDB(pathToFolder.getAbsolutePath() + "\\" + name + ".db").fileMmapEnableIfSupported().make());
		}
	}

	@SuppressWarnings("unchecked")
	public <V> ConcurrentMap<String, V> getOrMakeMap(String databaseName, String mapName) {
		return databases.get(databaseName).hashMap(mapName, Serializer.STRING, (Serializer<V>) Serializer.ELSA).createOrOpen();
	}
	@SuppressWarnings("unchecked")
	public <V> ConcurrentMap<Long, V> getOrMakeMapLong(String databaseName, String mapName) {
		return databases.get(databaseName).hashMap(mapName, Serializer.LONG, (Serializer<V>) Serializer.ELSA).createOrOpen();
	}

	public Set<String> getOrMakeSet(String databaseName, String setName) {
		return databases.get(databaseName).hashSet(setName, Serializer.STRING).createOrOpen();
	}

	public void close() {
		databases.forEach((k, db) -> {
			db.commit();
			db.close();
		});

	}

}