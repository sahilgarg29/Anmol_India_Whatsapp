const suggestionController = require('../controllers/suggestion.controller');

const router = require('express').Router();

router
	.route('/')
	.get(suggestionController.getAllSuggestions)
	.post(suggestionController.createSuggestion);

router
	.route('/:id')
	.get(suggestionController.getSuggestion)
	.patch(suggestionController.updateSuggestion)
	.delete(suggestionController.deleteSuggestion);

module.exports = router;
