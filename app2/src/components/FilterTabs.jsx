function FilterTabs({ filter, onFilterChange }) {
  const tabs = ['all', 'active', 'completed'];

  return (
    <div className="filter-tabs" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onFilterChange(tab)}
          className={`tab ${filter === tab ? 'active' : ''}`}
          role="tab"
          aria-selected={filter === tab}
          aria-label={`Show ${tab} tasks`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
}

export default FilterTabs;
