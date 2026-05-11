const STORAGE_KEY = 'fitness-app-state-v2';
const LEGACY_STORAGE_KEY = 'fitness-app-state-v1';
const DEFAULT_WATER_GOAL_ML = 3000;

const workoutForm = document.getElementById('workout-form');
const workoutList = document.getElementById('workout-list');
const emptyState = document.getElementById('empty-state');
const waterTotal = document.getElementById('water-total');
const waterProgress = document.getElementById('water-progress');
const addWaterButton = document.getElementById('add-water');
const addLargeWaterButton = document.getElementById('add-large-water');
const resetWaterButton = document.getElementById('reset-water');
const waterGoalInput = document.getElementById('water-goal');
const saveGoalButton = document.getElementById('save-goal');
const goalStatus = document.getElementById('goal-status');
const feedback = document.getElementById('form-feedback');
const workoutCount = document.getElementById('workout-count');
const totalSets = document.getElementById('total-sets');
const totalReps = document.getElementById('total-reps');
const todayLabel = document.getElementById('today-label');
const clearWorkoutsButton = document.getElementById('clear-workouts');

const defaultState = {
  waterMl: 0,
  waterGoalMl: DEFAULT_WATER_GOAL_ML,
  workouts: [],
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!saved) {
      return { ...defaultState };
    }

    const parsed = JSON.parse(saved);
    return {
      waterMl: Math.max(0, Number(parsed.waterMl) || 0),
      waterGoalMl: Math.max(250, Number(parsed.waterGoalMl) || DEFAULT_WATER_GOAL_ML),
      workouts: Array.isArray(parsed.workouts) ? parsed.workouts.map(normalizeWorkout).filter(Boolean) : [],
    };
  } catch {
    return { ...defaultState };
  }
}

const state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeWorkout(workout) {
  const exercise = normalizeExerciseName(String(workout.exercise || ''));
  const sets = Number(workout.sets);
  const reps = Number(workout.reps);

  if (!exercise || sets < 1 || reps < 1) {
    return null;
  }

  return {
    id: workout.id || createId(),
    exercise,
    sets,
    reps,
    notes: String(workout.notes || '').trim(),
    createdAt: Number(workout.createdAt) || Date.now(),
  };
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function renderTodayLabel() {
  todayLabel.textContent = new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
}

function getWorkoutTotals() {
  return state.workouts.reduce(
    (totals, workout) => ({
      sets: totals.sets + workout.sets,
      reps: totals.reps + workout.sets * workout.reps,
    }),
    { sets: 0, reps: 0 },
  );
}

function renderSummary() {
  const totals = getWorkoutTotals();
  workoutCount.textContent = String(state.workouts.length);
  totalSets.textContent = String(totals.sets);
  totalReps.textContent = String(totals.reps);
}

function renderWorkouts() {
  workoutList.innerHTML = '';

  if (state.workouts.length === 0) {
    emptyState.hidden = false;
    clearWorkoutsButton.disabled = true;
    return;
  }

  emptyState.hidden = true;
  clearWorkoutsButton.disabled = false;

  state.workouts.forEach((workout) => {
    const item = document.createElement('li');

    const details = document.createElement('div');
    details.className = 'workout-details';

    const title = document.createElement('strong');
    title.textContent = workout.exercise;

    const meta = document.createElement('span');
    meta.textContent = `${workout.sets} sets × ${workout.reps} reps · ${formatTime(workout.createdAt)}`;

    details.append(title, meta);

    if (workout.notes) {
      const notes = document.createElement('p');
      notes.textContent = workout.notes;
      details.appendChild(notes);
    }

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'delete-workout';
    removeButton.textContent = 'Delete';
    removeButton.setAttribute('aria-label', `Delete ${workout.exercise}`);
    removeButton.addEventListener('click', () => {
      state.workouts = state.workouts.filter((entry) => entry.id !== workout.id);
      saveState();
      renderAll();
    });

    item.append(details, removeButton);
    workoutList.appendChild(item);
  });
}

function renderHydration() {
  waterTotal.textContent = String(state.waterMl);
  waterGoalInput.value = String(state.waterGoalMl);

  const percent = Math.min(Math.round((state.waterMl / state.waterGoalMl) * 100), 999);
  const progressWidth = Math.min(percent, 100);
  waterProgress.style.width = `${progressWidth}%`;
  goalStatus.textContent = `${state.waterMl} / ${state.waterGoalMl} ml (${percent}%)`;
  goalStatus.classList.toggle('goal-complete', state.waterMl >= state.waterGoalMl);
}

function renderAll() {
  renderTodayLabel();
  renderSummary();
  renderWorkouts();
  renderHydration();
}

function normalizeExerciseName(name) {
  const trimmed = name.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!trimmed) {
    return '';
  }

  return trimmed.replace(/\b\w/g, (char) => char.toUpperCase());
}

function readPositiveNumber(input, label) {
  const value = Number(input.value);
  if (!Number.isInteger(value) || value < 1) {
    return { error: `${label} must be a whole number greater than 0.` };
  }

  return { value };
}

workoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  feedback.textContent = '';

  const exerciseInput = document.getElementById('exercise');
  const setsInput = document.getElementById('sets');
  const repsInput = document.getElementById('reps');
  const notesInput = document.getElementById('notes');

  const exercise = normalizeExerciseName(exerciseInput.value);
  const setsResult = readPositiveNumber(setsInput, 'Sets');
  const repsResult = readPositiveNumber(repsInput, 'Reps');

  if (!exercise) {
    feedback.textContent = 'Please enter an exercise name.';
    exerciseInput.focus();
    return;
  }

  if (setsResult.error) {
    feedback.textContent = setsResult.error;
    setsInput.focus();
    return;
  }

  if (repsResult.error) {
    feedback.textContent = repsResult.error;
    repsInput.focus();
    return;
  }

  state.workouts.unshift({
    id: createId(),
    exercise,
    sets: setsResult.value,
    reps: repsResult.value,
    notes: notesInput.value.trim(),
    createdAt: Date.now(),
  });

  saveState();
  workoutForm.reset();
  setsInput.value = '3';
  repsInput.value = '8';
  exerciseInput.focus();
  renderAll();
});

function addWater(amountMl) {
  state.waterMl += amountMl;
  saveState();
  renderHydration();
}

addWaterButton.addEventListener('click', () => addWater(250));
addLargeWaterButton.addEventListener('click', () => addWater(500));

resetWaterButton.addEventListener('click', () => {
  state.waterMl = 0;
  saveState();
  renderHydration();
});

saveGoalButton.addEventListener('click', () => {
  const nextGoal = Number(waterGoalInput.value);
  if (!Number.isInteger(nextGoal) || nextGoal < 250) {
    goalStatus.textContent = 'Goal must be a whole number of at least 250 ml.';
    goalStatus.classList.remove('goal-complete');
    waterGoalInput.focus();
    return;
  }

  state.waterGoalMl = nextGoal;
  saveState();
  renderHydration();
});

clearWorkoutsButton.addEventListener('click', () => {
  if (state.workouts.length === 0) {
    return;
  }

  state.workouts = [];
  saveState();
  renderAll();
});

renderAll();
