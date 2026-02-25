from urllib.parse import quote

from src.app import activities


def test_root_redirect(client):
    # Arrange: client fixture
    # Act
    resp = client.get("/", follow_redirects=False)
    # Assert
    assert resp.status_code in (302, 307)
    assert resp.headers.get("location", "").endswith("/static/index.html")


def test_get_activities(client):
    # Arrange
    # Act
    resp = client.get("/activities")
    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_success(client):
    # Arrange
    activity = "Tennis Club"
    email = "testuser@example.com"
    assert email not in activities[activity]["participants"]

    # Act
    resp = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})

    # Assert
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]
    assert f"Signed up {email} for {activity}" in resp.json().get("message", "")


def test_signup_already_signed_up(client):
    # Arrange
    activity = "Chess Club"
    email = "michael@mergington.edu"
    assert email in activities[activity]["participants"]

    # Act
    resp = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})

    # Assert
    assert resp.status_code == 400
    assert resp.json().get("detail") == "Student is already signed up for this activity"


def test_signup_unknown_activity(client):
    # Arrange
    # Act
    resp = client.post("/activities/NoSuchActivity/signup", params={"email": "x@y.com"})

    # Assert
    assert resp.status_code == 404
    assert resp.json().get("detail") == "Activity not found"


def test_signup_activity_full(client):
    # Arrange
    activity = "Chess Club"
    activities[activity]["max_participants"] = len(activities[activity]["participants"])
    email = "newstudent@example.com"

    # Act
    resp = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})

    # Assert
    assert resp.status_code == 400
    assert resp.json().get("detail") == "Activity is full"


def test_remove_participant_success(client):
    # Arrange
    activity = "Chess Club"
    email = "michael@mergington.edu"
    assert email in activities[activity]["participants"]

    # Act
    resp = client.delete(f"/activities/{quote(activity)}/participants/{email}")

    # Assert
    assert resp.status_code == 200
    assert email not in activities[activity]["participants"]
    assert f"Unregistered {email} from {activity}" in resp.json().get("message", "")


def test_remove_participant_not_signed_up(client):
    # Arrange
    activity = "Chess Club"
    email = "not-registered@example.com"
    assert email not in activities[activity]["participants"]

    # Act
    resp = client.delete(f"/activities/{quote(activity)}/participants/{email}")

    # Assert
    assert resp.status_code == 400
    assert resp.json().get("detail") == "Student is not signed up for this activity"
