function SearchBar({ searchQuery, setSearchQuery, searchInputRef }) {
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="search-bar">
      <input
        ref={searchInputRef}
        type="text"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search tasks... (Press / to focus)"
        aria-label="Search tasks"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="clear-search"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default SearchBar;
