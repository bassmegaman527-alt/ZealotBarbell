const STORAGE_KEY = 'fitness-app-state-v1';

const workoutForm = document.getElementById('workout-form');
const workoutList = document.getElementById('workout-list');
const emptyState = document.getElementById('empty-state');
const waterTotal = document.getElementById('water-total');
const addWaterButton = document.getElementById('add-water');
const resetWaterButton = document.getElementById('reset-water');
const waterGoalInput = document.getElementById('water-goal');
const saveGoalButton = document.getElementById('save-goal');
const goalStatus = document.getElementById('goal-status');
const feedback = document.getElementById('form-feedback');

const defaultState = {
  waterMl: 0,
  waterGoalMl: 3000,
  workouts: [],
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return { ...defaultState };
    }

    const parsed = JSON.parse(saved);
    return {
      waterMl: Number(parsed.waterMl) || 0,
      waterGoalMl: Number(parsed.waterGoalMl) || 3000,
      workouts: Array.isArray(parsed.workouts) ? parsed.workouts : [],
    };
  } catch {
    return { ...defaultState };
  }
}

const state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderWorkouts() {
  workoutList.innerHTML = '';

  if (state.workouts.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  state.workouts.forEach((workout, index) => {
    const item = document.createElement('li');

    const details = document.createElement('span');
    details.textContent = `${workout.exercise}: ${workout.sets} x ${workout.reps}`;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'delete-workout';
    removeButton.textContent = 'Delete';
    removeButton.addEventListener('click', () => {
      state.workouts.splice(index, 1);
      saveState();
      renderWorkouts();
    });

    item.append(details, removeButton);
    workoutList.appendChild(item);
  });
}

function renderHydration() {
  waterTotal.textContent = String(state.waterMl);
  waterGoalInput.value = String(state.waterGoalMl);

  const percent = Math.min(Math.round((state.waterMl / state.waterGoalMl) * 100), 999);
  goalStatus.textContent = `${state.waterMl} / ${state.waterGoalMl} ml (${percent}%)`;
}

function normalizeExerciseName(name) {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) {
    return '';
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

workoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  feedback.textContent = '';

  const exercise = normalizeExerciseName(document.getElementById('exercise').value);
  const sets = Number(document.getElementById('sets').value);
  const reps = Number(document.getElementById('reps').value);

  if (!exercise) {
    feedback.textContent = 'Please enter an exercise name.';
    return;
  }

  if (sets < 1 || reps < 1) {
    feedback.textContent = 'Sets and reps must be at least 1.';
    return;
  }

  state.workouts.push({ exercise, sets, reps });
  saveState();
  workoutForm.reset();
  document.getElementById('sets').value = '3';
  document.getElementById('reps').value = '8';

  renderWorkouts();
});

addWaterButton.addEventListener('click', () => {
  state.waterMl += 250;
  saveState();
  renderHydration();
});

resetWaterButton.addEventListener('click', () => {
  state.waterMl = 0;
  saveState();
  renderHydration();
});

saveGoalButton.addEventListener('click', () => {
  const nextGoal = Number(waterGoalInput.value);
  if (!nextGoal || nextGoal < 250) {
    goalStatus.textContent = 'Goal must be at least 250 ml.';
    return;
  }

  state.waterGoalMl = nextGoal;
  saveState();
  renderHydration();
});

renderWorkouts();
renderHydration();
