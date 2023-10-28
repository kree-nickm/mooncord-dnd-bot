exports.run = async function(interaction)
{
  await interaction.showModal({
    "title": "Moonlight RPG Application",
    "custom_id": "applicationSubmit",
    "components": [
      {
        "type": 1,
        "components": [
          {
            "type": 4,
            "custom_id": "comments",
            "label": "Comments",
            "style": 2,
            "placeholder": "Anything you want GMs to know, e.g. game preferences, potential changes to your availability, etc.",
          },
        ],
      },
    ],
  });
  return true;
};
