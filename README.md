<div align="center">
  <h1>🏥 МИС Картотека</h1>

  <p>
    <a href="https://github.com/S4dK177y/mis-kartoteka/releases"><img src="https://img.shields.io/github/v/release/S4dK177y/mis-kartoteka?color=blue&label=version" alt="GitHub Release"></a>
    <img src="https://img.shields.io/badge/Status-In_Development-orange" alt="Status">
    <a href="https://github.com/S4dK177y/mis-kartoteka/actions/workflows/ci.yml"><img src="https://github.com/S4dK177y/mis-kartoteka/actions/workflows/ci.yml/badge.svg" alt="CI Pipeline"></a>
    <a href="https://github.com/S4dK177y/mis-kartoteka/actions/workflows/docker.yml"><img src="https://github.com/S4dK177y/mis-kartoteka/actions/workflows/docker.yml/badge.svg" alt="Docker Build"></a>
    <br>
    <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker">
    <img src="https://img.shields.io/badge/Grafana-F46800?style=flat&logo=grafana&logoColor=white" alt="Grafana">
    <br>
    <img src="https://img.shields.io/badge/AI_Assisted-Antigravity_IDE-blueviolet?logo=google&logoColor=white" alt="Antigravity">
  </p>

  <h3>Прототип веб-приложения для автоматизации работы медицинского персонала.</h3>
</div>

---

> **⚠️ Примечание:** Данный репозиторий является **пет-проектом** и песочницей для обучения. Изначально это прототип медицинской информационной системы (МИС), написанный для автоматизации внутреннего документооборота военного госпиталя. Сейчас проект активно используется для изучения и внедрения современных практик **DevOps, CI/CD, тестирования и контроля качества (QA)**. Проект находится в стадии активной доработки.

## 📖 О проекте

**МИС Картотека** позволяет вести учет поступивших пациентов, отслеживать переводы между отделениями, сохранять историю консультаций и заключения профильных врачебных комиссий.

### ✨ Ключевые возможности

- **Управление пациентами:** Полный цикл работы с профилем пациента (поступление, перевод, выписка), включая учет специфичных военных данных (звание, статус, номер части).
- **История болезней:** Ведение медицинских записей и документации профильных специалистов.
- **Хранение документов:** Безопасная загрузка и предпросмотр сканов документов, привязанных к истории болезни.
- **Криптография (ALE):** Высокочувствительные персональные данные шифруются на уровне приложения по алгоритму **ГОСТ Р 34.12-2018 "Кузнечик"** в режиме MGM до попадания в базу данных.
- **Отчетность:** Автоматическая генерация сводных таблиц и выгрузка в формате Excel.
- **Администрирование:** Разделение ролей (Врач / Администратор), управление пользователями, безопасный сброс паролей и ведение полного журнала действий (Audit Log).
- **Мониторинг:** Встроенный сбор метрик через Prometheus и готовые дашборды в Grafana.

## 🚀 DevOps & QA Roadmap

Проект используется как плацдарм для отработки следующих навыков:

- [x] **Контейнеризация:** Multi-stage сборка Frontend, Nginx Reverse Proxy
- [x] **Базы данных:** Миграция базы данных с SQLite на PostgreSQL
- [x] **Бэкапы:** Написание отказоустойчивой системы автоматических бэкапов (`pg_dump` + `psql`)
- [x] **CI/CD:** Настройка пайплайнов проверок, сборки и релизов в GitHub Actions (`semantic-release`)
- [x] **Мониторинг:** Внедрение систем Observability (Prometheus & Grafana)
- [ ] **Автотестирование:** Jest/Supertest для API, Playwright для E2E сценариев *(В процессе)*

## 🌍 Живая демонстрация (Live Demo)

Для оценки интерфейса и функциональности системы без необходимости разворачивать сервер, проект доступен по адресу:
**[Вставьте ссылку на ваш сайт здесь]**

> **Данные для входа в демо-режим:**
> Логин: `demo` | Пароль: `password`
> *В этом режиме создание, изменение и удаление данных заблокировано в целях безопасности.*

## 🐳 Самостоятельное развертывание

Запуск собственного инстанса проекта осуществляется через Docker Compose:

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/S4dK177y/mis-kartoteka.git
   cd mis-kartoteka
   ```
2. Создайте файл переменных окружения `.env` (в корневой папке) и пропишите туда доступы к базе данных:
   ```env
   DATABASE_URL="postgresql://user:pass@db:5432/mis_db"
   PORT=80
   GRAFANA_ADMIN_PASSWORD="super-secret-password"
   ```
3. Запустите контейнеры:
   ```bash
   docker compose up -d --build
   ```
4. Откройте браузер и перейдите по адресу `http://localhost`. При первом запуске система автоматически создаст таблицы в базе данных и предложит создать учетную запись администратора.
