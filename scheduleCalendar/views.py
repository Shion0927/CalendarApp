import json
from .models import Event
from .forms import EventForm, CalendarForm, UpdateForm
from django.http import Http404, JsonResponse
import datetime
from datetime import datetime
from django.template import loader
from django.http import HttpResponse
from django.middleware.csrf import get_token
from django.core.exceptions import ObjectDoesNotExist

def get_events(request):
    """
    イベントの取得
    """

    if request.method == "GET":
        # GETは対応しない
        raise Http404()

    # JSONの解析
    datas = json.loads(request.body)

    # バリデーション
    calendarForm = CalendarForm(datas)
    if calendarForm.is_valid() == False:
        # バリデーションエラー
        raise Http404()

    # リクエストの取得
    start_date_str = datas["start_date"]
    end_date_str = datas["end_date"]

    # JavaScriptからのフォーマットに合わせて変換
    formatted_start_date = datetime.strptime(
        start_date_str, "%Y-%m-%dT%H:%M"
    ).strftime("%Y-%m-%d %H:%M:%S")
    formatted_end_date = datetime.strptime(
        end_date_str, "%Y-%m-%dT%H:%M"
    ).strftime("%Y-%m-%d %H:%M:%S")

    # FullCalendarの表示範囲のみ表示
    events = Event.objects.filter(
        start_date__lt=formatted_end_date, end_date__gt=formatted_start_date
    )

    # fullcalendarのため配列で返却
    list = []
    for event in events:
        list.append(
            {
                "title": event.event_name,
                "start": event.start_date,
                "end": event.end_date,
                "extendedProps": {
                    "id": event.id,  # ここでidを追加
                    "description": event.description
                },
            }
        )
    return JsonResponse(list, safe=False)

def add_event(request):
    """
    イベント登録
    """

    if request.method == "GET":
        # GETは対応しない
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # JSONの解析
    datas = json.loads(request.body)

    # バリデーション
    eventForm = EventForm(datas)
    if eventForm.is_valid() == False:
        # バリデーションエラー
        return JsonResponse({"error": "validation"})


    # リクエストの取得
    start_date = datas["start_date"]
    end_date = datas["end_date"]
    event_name = datas["event_name"]
    description = datas["event_description"]
    # 日付に変換
    date_format = "%Y-%m-%dT%H:%M"
    formatted_start_date = datetime.strptime(start_date, date_format)
    formatted_end_date = datetime.strptime(end_date, date_format)

    # 登録処理
    event = Event(
        event_name=str(event_name),
        start_date=formatted_start_date,
        end_date=formatted_end_date,
        description=str(description),
    )
    event.save()

    # 空を返却
    return HttpResponse("")

def delete_event(request):
    """
    イベント削除
    """
    if request.method == "POST":
        # POSTリクエストからデータを取得
        data = json.loads(request.body)

        # バリデーション
        event_id = data.get("event_id")
        if not event_id:
            return JsonResponse({"error": "Invalid data"}, status=400)

        try:
            # イベントIDに基づいてイベントを取得し削除
            event = Event.objects.get(id=event_id)
            event.delete()
            return JsonResponse({"success": True})
        except Event.DoesNotExist:
            return JsonResponse({"error": "Event not found"}, status=404)
    else:
        # POST以外のリクエストには対応しない
        return JsonResponse({"error": "Method not allowed"}, status=405)

def edit_event(request):
    """
    イベント編集
    """

    if request.method == "GET":
        # GETは対応しない
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # JSONの解析
    datas = json.loads(request.body)

    # バリデーション
    updateForm = UpdateForm(datas)
    if not updateForm.is_valid():
        # バリデーションエラー
        print(updateForm.errors)
        return JsonResponse({"error": "validation"})

    # リクエストの取得
    event_id = datas["event_id"]
    start_date = datas["edit_event_start_date"]
    end_date = datas["edit_event_end_date"]
    event_name = datas["edit_event_name"]
    description = datas["edit_event_description"]

    # 日付に変換
    date_format = "%Y-%m-%dT%H:%M"
    formatted_start_date = datetime.strptime(start_date, date_format)
    formatted_end_date = datetime.strptime(end_date, date_format)

    try:
        event = Event.objects.get(id=event_id)

        # 既存のイベントを更新
        event.event_name = str(event_name)
        event.start_date = formatted_start_date
        event.end_date = formatted_end_date
        event.description = str(description)
        event.save()

        return JsonResponse({"message": "Event updated successfully"})
    except ObjectDoesNotExist:
        return JsonResponse({"error": "Event not found"}, status=404)

def index(request):
    """
    カレンダー画面
    """
    # CSRFのトークンを発行する
    get_token(request)

    template = loader.get_template("scheduleCalendar/index.html")
    return HttpResponse(template.render())