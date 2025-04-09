document.addEventListener('DOMContentLoaded', () => {
  // Get chart contexts
  const statusChartContext = document.getElementById('statusChart').getContext('2d');
  const priorityChartContext = document.getElementById('priorityChart').getContext('2d');
  const assignmentChartContext = document.getElementById('assignmentChart').getContext('2d');
  
  // Get stats data from the page
  const stats = JSON.parse(document.getElementById('chartStatsData').textContent);
  
  // Define chart colors - using the same colors as in the cards for consistency
  const colors = {
    open: '#dc3545',       // Red (danger)
    inProgress: '#ffc107', // Yellow (warning)
    solved: '#198754',     // Green (success)
    closed: '#6c757d',     // Gray (secondary) - not used in chart
    high: '#dc3545',       // Red (danger)
    medium: '#ffc107',     // Yellow (warning)
    low: '#0dcaf0',        // Light blue (info)
    firstLine: '#0d6efd',  // Blue (primary)
    secondLine: '#0dcaf0', // Light blue (info)
    admin: '#212529',      // Dark
    unassigned: '#6c757d'  // Gray (secondary)
  };
  
  // Create Status Distribution chart - excluding closed tickets
  const statusChart = new Chart(statusChartContext, {
    type: 'doughnut',
    data: {
      labels: ['Åpne', 'Under arbeid', 'Løst'],
      datasets: [{
        data: [stats.openCount, stats.inProgressCount, stats.solvedCount],
        backgroundColor: [colors.open, colors.inProgress, colors.solved],
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 15
          }
        },
        title: {
          display: true,
          text: 'Status fordeling (aktive henvendelser)',
          font: {
            size: 16
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '60%'
    }
  });
  
  // Create Priority Distribution chart - excluding closed tickets
  const priorityChart = new Chart(priorityChartContext, {
    type: 'doughnut',
    data: {
      labels: ['Høy', 'Medium', 'Lav'],
      datasets: [{
        data: [stats.highPriorityCount, stats.mediumPriorityCount, stats.lowPriorityCount],
        backgroundColor: [colors.high, colors.medium, colors.low],
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 15
          }
        },
        title: {
          display: true,
          text: 'Prioritet fordeling (aktive henvendelser)',
          font: {
            size: 16
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '60%'
    }
  });

  // Create Assignment Distribution chart
  const assignmentChart = new Chart(assignmentChartContext, {
    type: 'doughnut',
    data: {
      labels: ['1. linje', '2. linje', 'Admin', 'Ikke tildelt'],
      datasets: [{
        data: [stats.firstLineCount, stats.secondLineCount, stats.adminAssignedCount, stats.unassignedCount],
        backgroundColor: [colors.firstLine, colors.secondLine, colors.admin, colors.unassigned],
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 15
          }
        },
        title: {
          display: true,
          text: 'Tildeling fordeling (aktive henvendelser)',
          font: {
            size: 16
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '60%'
    }
  });
  
  // Update charts when dark mode changes to adjust text colors
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', () => {
      const isDarkMode = darkModeToggle.checked;
      const textColor = isDarkMode ? '#e0e0e0' : '#333333';
      
      [statusChart, priorityChart, assignmentChart].forEach(chart => {
        chart.options.plugins.title.color = textColor;
        chart.options.plugins.legend.labels.color = textColor;
        chart.update();
      });
    });
    
    // Initialize chart text colors based on current mode
    if (document.body.classList.contains('dark-mode')) {
      [statusChart, priorityChart, assignmentChart].forEach(chart => {
        chart.options.plugins.title.color = '#e0e0e0';
        chart.options.plugins.legend.labels.color = '#e0e0e0';
        chart.update();
      });
    }
  }
});
