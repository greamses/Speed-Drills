class CustomDropdown {
  constructor(container) {
    this.container = container;
    this.selected = container.querySelector('.dropdown-selected');
    this.options = container.querySelectorAll('.dropdown-option');
    this.value = '2'; // Default value
    
    this.init();
  }
  
  init() {
    // Set initial selected option
    this.setSelectedOption(this.value);
    
    // Click handler for dropdown toggle
    this.selected.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    
    // Click handlers for options
    this.options.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = option.getAttribute('data-value');
        this.selectOption(value);
        this.close();
      });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.close();
    });
    
    // Prevent closing when clicking inside dropdown
    this.container.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  toggle() {
    this.container.classList.toggle('active');
  }
  
  open() {
    this.container.classList.add('active');
  }
  
  close() {
    this.container.classList.remove('active');
  }
  
  selectOption(value) {
    this.value = value;
    this.setSelectedOption(value);
    
    // Dispatch custom event
    const event = new CustomEvent('dropdownChange', {
      detail: { value: this.value }
    });
    this.container.dispatchEvent(event);
  }
  
  setSelectedOption(value) {
    const option = Array.from(this.options).find(opt =>
      opt.getAttribute('data-value') === value
    );
    
    if (option) {
      // Update selected text
      this.selected.querySelector('span').textContent = option.textContent;
      
      // Update selected state for options
      this.options.forEach(opt => {
        opt.classList.remove('selected');
      });
      option.classList.add('selected');
    }
  }
  
  getValue() {
    return this.value;
  }
  
  setValue(value) {
    this.selectOption(value);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const dropdownContainer = document.getElementById('number-count-dropdown');
  if (dropdownContainer) {
    window.numberCountDropdown = new CustomDropdown(dropdownContainer);
  }
});