
/**
 * @jest-environment jsdom
 */
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import router from '../app/Router.js';
import userEvent from "@testing-library/user-event";
import mockStore from '../__mocks__/store.js';

describe("Given I am connected as an employee", () => {
// setup initial avec navigation via router()
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: 'a@a'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.NewBill)
  });

  describe("When I am on the NewBill page", () => {
    describe("When I upload a file", () => {
      test("Then if the extension is wrong it should display an error message", async () => {
        const fileInput = screen.getByTestId("file");
        const invalidFile = new File(['ceci est un fichier'], 'openclassrooms.gif', { type: 'image/gif' });
        userEvent.upload(fileInput, invalidFile);

// test de la présence du message d'erreur dans le DOM
        const errorMessage = screen.getByTestId("errorMessage");
        await waitFor(() => expect(errorMessage).toHaveTextContent("Ce type de fichier n'est pas supporté. Merci de choisir un fichier jpeg, jpg ou png"));
      });
    });

    describe("When I submit the form with correct details", () => {
      test("Then it should navigate to Bills", async () => {
        screen.getByTestId("expense-type").value = "Services en ligne";
        screen.getByTestId("expense-name").value = "Abonnement Internet";
        screen.getByTestId("datepicker").value = "2024-03-03";
        screen.getByTestId("amount").value = "50";
        screen.getByTestId("vat").value = "20";
        screen.getByTestId("pct").value = "20";
        screen.getByTestId("commentary").value = "frais de mise en place pour l'abonnement Internet";

        const form = screen.getByTestId("form-new-bill");
        await waitFor(() => expect(form).toBeInTheDocument())
        fireEvent.submit(form);

// test de l'adresse après la soumission du formulaire
        await waitFor(() => expect(window.location.href).toContain(ROUTES_PATH.Bills));
      });
    });
  })
})

// tests d'integration POST
describe("Given I am connected as an employee on the NewBill page", () => {
// setup initial sans navigation avec NewBillUI()
  beforeEach(() => {
    window.localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee',
        email: 'e@e',
      })
    );
    document.body.innerHTML = NewBillUI();
  });

  describe("When I try to upload a file", () => {
    test('Then it should create a New Bill', async () => {
      const mockBills = jest.spyOn(mockStore, 'bills');
      const mockFile = {
        fileUrl: 'https://localhost:3456/images/test.jpg',
        key: '1234',
      };
      const post = await mockStore.bills().create(mockFile);
      expect(mockBills).toHaveBeenCalled();
      expect(post).toEqual(mockFile);
    });
  });

  test('Then it should update a New Bill', async () => {
    const mockBill = {
      id: '47qAXb6fIm2zOKkLzMro',
      vat: '80',
      fileUrl:
        'https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a',
      status: 'pending',
      type: 'Hôtel et logement',
      commentary: 'séminaire billed',
      name: 'encore',
      fileName: 'preview-facture-free-201801-pdf-1.jpg',
      date: '2004-04-04',
      amount: 400,
      commentAdmin: 'ok',
      email: 'a@a',
      pct: 20,
    };

    const post = await mockStore.bills().update(mockBill);

    expect(mockStore.bills).toHaveBeenCalled();
    expect(post).toEqual(mockBill);
  });

  describe('When I try to upload a file and an error occurs', () => {
    test('Then it fails and an error is displayed in the console', async () => {
      const consoleError = jest.spyOn(console, 'error');

      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: jest.fn(() => Promise.reject(new Error('error in console'))),
          update: jest.fn()
        };
      });

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      const mock = {
        preventDefault: jest.fn(),
        target: {
          file: [new File(['ceci est un fichier'], 'image.jpg', { type: 'image/jpg' })],
          value: 'C:\\openclassrooms\\image.jpg',
        },
      };

      newBill.handleChangeFile(mock);
      await waitFor(() => expect(consoleError).toBeCalledWith(new Error('error in console')));
    });
  });
});

